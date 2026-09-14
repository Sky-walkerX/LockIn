"""Document → markdown.

The output lands in `Resource.extracted` and is chunked by lib/rag/sources.ts
like any other note, so the only real requirement is *clean markdown*: headings
that survive, tables that stay tabular, and none of the navigation furniture
that would otherwise get embedded and retrieved as if it were study material.
"""

from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urlparse

import httpx
import pymupdf4llm
import pymupdf
import trafilatura

from app.config import (
    FETCH_TIMEOUT_SECONDS,
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


def _assert_public_url(url: str) -> None:
    """Refuse to fetch anything on a private network.

    The URL reaching this service comes from a `Resource` row, which is
    user-authored — so without this check, saving a resource pointed at
    169.254.169.254 would turn /parse into a reader for Cloud Run's metadata
    server, and anything else inside the VPC. The bucket URLs this is actually
    meant to fetch are all public.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ParseError(f"Unsupported URL scheme: {parsed.scheme or '(none)'}")
    if not parsed.hostname:
        raise ParseError("URL has no host.")

    try:
        resolved = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as error:
        raise ParseError(f"Could not resolve {parsed.hostname}.") from error

    for family, *_rest, sockaddr in resolved:
        address = ipaddress.ip_address(sockaddr[0])
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_reserved
            or address.is_multicast
        ):
            raise ParseError(f"Refusing to fetch a private address ({address}).")


# Plenty of sites (Wikipedia included) 403 a client with no User-Agent at all,
# so this can't be left blank — but it also shouldn't claim to be a browser,
# since this traffic isn't rendering pages or running scripts.
USER_AGENT = "LockInIngestBot/1.0 (+https://github.com/; study-notes ingestion)"

MAX_REDIRECTS = 5


def _download(url: str) -> tuple[bytes, str]:
    """Fetch with a hard byte cap, streaming so an oversize file is abandoned
    rather than buffered in full first.

    Redirects are followed by hand rather than via httpx's `follow_redirects`,
    because `_assert_public_url` only runs against whatever URL is passed to
    it — a redirect target is a second URL that needs the exact same check. A
    resource pointed at a public URL that 302s to an internal one would
    otherwise sail straight past the SSRF guard on the second hop.
    """
    headers = {"User-Agent": USER_AGENT}
    chunks: list[bytes] = []
    total = 0
    content_type = ""

    try:
        with httpx.Client(timeout=FETCH_TIMEOUT_SECONDS, follow_redirects=False) as client:
            current_url = url
            for _hop in range(MAX_REDIRECTS + 1):
                _assert_public_url(current_url)
                with client.stream("GET", current_url, headers=headers) as response:
                    if response.is_redirect:
                        location = response.headers.get("location")
                        if not location:
                            raise ParseError("Redirected with no Location header.")
                        current_url = str(response.next_request.url) if response.next_request else location
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
