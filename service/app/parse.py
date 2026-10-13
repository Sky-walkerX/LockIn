"""Document → markdown.

The output lands in `Resource.extracted` and is chunked by lib/rag/sources.ts
like any other note, so the only real requirement is *clean markdown*: headings
that survive, tables that stay tabular, and none of the navigation furniture
that would otherwise get embedded and retrieved as if it were part of the notes.
"""

from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse

import httpx
import pymupdf4llm
import pymupdf
import trafilatura

from app.config import (
    FETCH_TIMEOUT_SECONDS,
    INGEST_ALLOWED_HOSTS,
    MAX_DOWNLOAD_BYTES,
    MAX_MARKDOWN_CHARS,
    MAX_PDF_PAGES,
)


class ParseError(Exception):
    """A request that can't be served. Surfaces as a 4xx with this message."""


@dataclass
class Parsed:
    markdown: str
    title: str | None
    pages: int | None
    kind: str
    truncated: bool


def _is_public(address: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Whether an address is on the public internet.

    `is_global` is the allow-list reading of that question: it's false for
    private, loopback and link-local ranges, and also for the ones a deny-list
    forgets: 0.0.0.0 (which connects to this machine), carrier-grade NAT
    (100.64.0.0/10) and the documentation and reserved blocks. An IPv4 address
    written as IPv6 (::ffff:10.0.0.5, or through NAT64) is judged as the IPv4
    address it is.
    """
    if address.version == 6 and address.ipv4_mapped is not None:
        address = address.ipv4_mapped
    elif address.version == 6 and address in _NAT64:
        # On an IPv6-only network every IPv4 address is reached through this
        # prefix, the private ones included: the last four bytes are the
        # address that's really meant.
        address = ipaddress.IPv4Address(int(address) & 0xFFFFFFFF)
    return address.is_global and not address.is_multicast


_NAT64 = ipaddress.ip_network("64:ff9b::/96")


def _public_address(url: str) -> str | None:
    """The address to connect to for this URL, having checked it's public.

    The URL reaching this service comes from a `Resource` row, which is
    user-authored, so without this check saving a resource pointed at
    169.254.169.254 would turn /parse into a reader for the cloud metadata
    server, and for anything else on the private network.

    The host is resolved here, once, and the caller connects to the address
    this returns. Checking a name and then handing the name to the HTTP client
    resolves it a second time, and a DNS server that answers with a public
    address first and a private one after gets past the check that way.

    None means the host is one the operator named (INGEST_ALLOWED_HOSTS, the
    app's own container when self-hosted): trusted by name and connected to by
    name. Redirects come back through here, so a trusted host can't bounce the
    fetch somewhere else private.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ParseError(f"Unsupported URL scheme: {parsed.scheme or '(none)'}")
    if not parsed.hostname:
        raise ParseError("URL has no host.")
    if parsed.hostname.lower() in INGEST_ALLOWED_HOSTS:
        return None

    # An address written out needs no lookup, and is connected to as written.
    try:
        literal = ipaddress.ip_address(parsed.hostname)
    except ValueError:
        literal = None
    if literal is not None:
        if not _is_public(literal):
            raise ParseError(f"Refusing to fetch a private address ({literal}).")
        return str(literal)

    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        resolved = socket.getaddrinfo(parsed.hostname, port, type=socket.SOCK_STREAM)
    except (socket.gaierror, ValueError, UnicodeError) as error:
        raise ParseError(f"Could not resolve {parsed.hostname}.") from error

    addresses: list[str] = []
    for _family, *_rest, sockaddr in resolved:
        try:
            # A link-local IPv6 answer carries its interface ("fe80::1%eth0").
            address = ipaddress.ip_address(str(sockaddr[0]).split("%")[0])
        except ValueError as error:
            raise ParseError(f"Could not resolve {parsed.hostname}.") from error
        # Every answer has to be public, not just the one that gets used: a
        # name that also answers with a private address is not one to trust.
        if not _is_public(address):
            raise ParseError(f"Refusing to fetch a private address ({address}).")
        addresses.append(str(address))

    if not addresses:
        raise ParseError(f"Could not resolve {parsed.hostname}.")
    return addresses[0]


# Plenty of sites (Wikipedia included) 403 a client with no User-Agent at all,
# so this can't be left blank — but it also shouldn't claim to be a browser,
# since this traffic isn't rendering pages or running scripts.
USER_AGENT = "LockInIngestBot/1.0 (+https://github.com/Sky-walkerX/LockIn; notes ingestion)"

MAX_REDIRECTS = 5


def _download(url: str) -> tuple[bytes, str]:
    """Fetch with a hard byte cap, streaming so an oversize file is abandoned
    rather than buffered in full first.

    Redirects are followed by hand rather than via httpx's `follow_redirects`,
    because `_public_address` only checks the URL it's given, and a redirect
    target is a second URL that needs the same check. A resource pointed at a
    public URL that 302s to an internal one would otherwise sail straight past
    the guard on the second hop.

    Each hop connects to the address `_public_address` checked, with the
    host's name sent as the Host header and, over TLS, as the name the
    certificate has to match.
    """
    chunks: list[bytes] = []
    total = 0
    content_type = ""

    try:
        with httpx.Client(timeout=FETCH_TIMEOUT_SECONDS, follow_redirects=False) as client:
            current_url = url
            for _hop in range(MAX_REDIRECTS + 1):
                address = _public_address(current_url)
                request_url: str | httpx.URL = current_url
                headers = {"User-Agent": USER_AGENT}
                extensions: dict[str, str] = {}
                if address is not None:
                    named = httpx.URL(current_url)
                    request_url = named.copy_with(host=address)
                    headers["Host"] = named.netloc.decode("ascii")
                    if named.scheme == "https":
                        extensions["sni_hostname"] = named.host

                with client.stream("GET", request_url, headers=headers, extensions=extensions) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise ParseError("Redirected with no Location header.")
                        # Against the URL as named, not the address connected to.
                        current_url = urljoin(current_url, location)
                        continue

                    response.raise_for_status()
                    content_type = response.headers.get("content-type", "").split(";")[0].strip()
                    for chunk in response.iter_bytes():
                        total += len(chunk)
                        if total > MAX_DOWNLOAD_BYTES:
                            raise ParseError(
                                f"File exceeds the {MAX_DOWNLOAD_BYTES // 1024 // 1024} MB limit."
                            )
                        chunks.append(chunk)
                    break
            else:
                raise ParseError(f"Too many redirects (limit {MAX_REDIRECTS}).")
    except httpx.HTTPStatusError as error:
        raise ParseError(f"Source returned {error.response.status_code}.") from error
    except httpx.HTTPError as error:
        raise ParseError(f"Could not fetch the source: {error}.") from error

    return b"".join(chunks), content_type


def _detect_kind(content_type: str, url: str, body: bytes) -> str:
    if body.startswith(b"%PDF-"):
        return "pdf"
    if "pdf" in content_type or url.lower().split("?")[0].endswith(".pdf"):
        return "pdf"
    if "html" in content_type:
        return "html"
    if content_type.startswith("text/"):
        return "text"
    return "html"


def _parse_pdf(body: bytes) -> Parsed:
    try:
        document = pymupdf.open(stream=body, filetype="pdf")
    except Exception as error:
        raise ParseError(f"Not a readable PDF: {error}") from error

    with document:
        if document.page_count > MAX_PDF_PAGES:
            raise ParseError(
                f"PDF has {document.page_count} pages; the limit is {MAX_PDF_PAGES}."
            )
        pages = document.page_count
        title = (document.metadata or {}).get("title") or None
        markdown = pymupdf4llm.to_markdown(document, show_progress=False)

    if not markdown.strip():
        raise ParseError(
            "No text could be extracted. This is most likely a scanned PDF, "
            "which would need OCR."
        )
    return Parsed(markdown, title, pages, "pdf", False)


def _parse_html(body: bytes) -> Parsed:
    html = body.decode("utf-8", errors="replace")
    markdown = trafilatura.extract(
        html,
        output_format="markdown",
        include_tables=True,
        include_links=False,
        favor_precision=True,
    )
    if not markdown or not markdown.strip():
        raise ParseError("No article text could be extracted from this page.")

    title = None
    metadata = trafilatura.extract_metadata(html)
    if metadata is not None:
        title = metadata.title or None

    return Parsed(markdown, title, None, "html", False)


def _parse_text(body: bytes) -> Parsed:
    text = body.decode("utf-8", errors="replace").replace("\r\n", "\n")
    if not text.strip():
        raise ParseError("The file is empty.")
    return Parsed(text, None, None, "text", False)


def parse(url: str, kind: str = "auto") -> Parsed:
    body, content_type = _download(url)
    resolved = _detect_kind(content_type, url, body) if kind == "auto" else kind

    if resolved == "pdf":
        result = _parse_pdf(body)
    elif resolved == "text":
        result = _parse_text(body)
    else:
        result = _parse_html(body)

    # A cap rather than an error: 2 MB of markdown is already several hundred
    # chunks, and half a textbook indexed beats a resource stuck in FAILED.
    if len(result.markdown) > MAX_MARKDOWN_CHARS:
        result.markdown = result.markdown[:MAX_MARKDOWN_CHARS]
        result.truncated = True

    return result
