"""API-surface tests: auth, contracts, and the parser's failure modes."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import parse as parser
from app.config import EMBEDDING_DIMS, EMBEDDING_MODEL, MAX_EMBED_BATCH, MAX_EMBED_CHARS
from app.main import app

SECRET = "dev-secret"
AUTH = {"Authorization": f"Bearer {SECRET}"}


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_health_needs_no_auth(client: TestClient) -> None:
    """Cloud Run's probe and the warm-up ping both hit this unauthenticated."""
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model"] == EMBEDDING_MODEL
    assert body["model_loaded"] is True, "lifespan should load weights before serving"


@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer wrong"}, {"Authorization": SECRET}],
    ids=["missing", "wrong-token", "no-bearer-prefix"],
)
def test_embed_rejects_bad_credentials(client: TestClient, headers: dict) -> None:
    response = client.post("/embed", json={"texts": ["hi"], "role": "passage"}, headers=headers)
    assert response.status_code == 401


def test_embed_returns_tagged_vectors(client: TestClient) -> None:
    response = client.post(
        "/embed", json={"texts": ["alpha", "beta"], "role": "passage"}, headers=AUTH
    )
    assert response.status_code == 200
    body = response.json()
    assert body["model"] == EMBEDDING_MODEL
    assert body["dims"] == EMBEDDING_DIMS
    assert len(body["vectors"]) == 2
    assert all(len(v) == EMBEDDING_DIMS for v in body["vectors"])


def test_embed_distinguishes_roles(client: TestClient) -> None:
    """The query prefix has to actually reach the model, not just the helper."""
    as_query = client.post("/embed", json={"texts": ["svd"], "role": "query"}, headers=AUTH)
    as_passage = client.post("/embed", json={"texts": ["svd"], "role": "passage"}, headers=AUTH)
    assert as_query.json()["vectors"][0] != as_passage.json()["vectors"][0]


@pytest.mark.parametrize(
    "payload",
    [
        {"texts": [], "role": "passage"},
        {"texts": ["x"], "role": "sideways"},
        {"texts": ["x"] * (MAX_EMBED_BATCH + 1), "role": "passage"},
        {"texts": ["x" * (MAX_EMBED_CHARS + 1)], "role": "passage"},
    ],
    ids=["empty", "bad-role", "over-batch-cap", "over-length"],
)
def test_embed_rejects_invalid_payloads(client: TestClient, payload: dict) -> None:
    assert client.post("/embed", json=payload, headers=AUTH).status_code == 422


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_the_api_isnt_described_to_strangers(client: TestClient, path: str) -> None:
    """On a public URL these pages would hand anyone the service's schema."""
    assert client.get(path).status_code == 401
    assert client.get(path, headers=AUTH).status_code == 404


def test_parse_says_its_busy_rather_than_queueing(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """With every slot taken, a caller is told so while it can still be told."""
    import anyio

    from app import main

    monkeypatch.setattr(main, "PARSE_QUEUE_SECONDS", 0.05)
    monkeypatch.setattr(main.app.state, "parse_slots", anyio.Semaphore(0))
    response = client.post("/parse", json={"url": "https://example.com/a.pdf"}, headers=AUTH)
    assert response.status_code == 503
    assert response.headers["retry-after"] == "60"
    assert "busy" in response.json()["detail"]


# --- parser ---------------------------------------------------------------


@pytest.mark.parametrize(
    "url",
    [
        "http://169.254.169.254/computeMetadata/v1/",  # GCP metadata server
        "http://localhost:8080/admin",
        "http://127.0.0.1/",
        "http://10.0.0.5/internal",
        "http://0.0.0.0:8080/",  # this machine, by the address a deny-list forgets
        "http://100.64.0.1/",  # carrier-grade NAT: private, though not "private"
        "http://[::1]/",
        "http://[::ffff:10.0.0.5]/",  # an IPv4 address in IPv6 clothing
        "http://[64:ff9b::a9fe:a9fe]/",  # the metadata server, through NAT64
        "http://[fe80::1]/",
        "file:///etc/passwd",
    ],
)
def test_parse_refuses_private_and_non_http_urls(url: str) -> None:
    """Resource.url is user-authored, so /parse must not become a reader for
    anything inside the VPC."""
    with pytest.raises(parser.ParseError):
        parser._public_address(url)


def test_parse_allows_a_public_address() -> None:
    assert parser._public_address("https://93.184.215.14/paper.pdf") == "93.184.215.14"


def _resolves_to(*answers: str):
    """A stand-in for socket.getaddrinfo that gives each call the next answer."""
    import socket

    remaining = list(answers)
    asked: list[str] = []

    def getaddrinfo(host, port, *args, **kwargs):
        asked.append(host)
        answer = remaining.pop(0) if len(remaining) > 1 else remaining[0]
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (answer, port))]

    return getaddrinfo, asked


class _Recorder:
    """An httpx.Client stand-in that answers every request with a 200 and
    keeps what it was asked for."""

    requests: list[dict]

    def __init__(self, *args, **kwargs) -> None:
        pass

    def stream(self, method, url, headers=None, extensions=None):
        type(self).requests.append({"url": str(url), "headers": headers, "extensions": extensions})
        return self

    is_redirect = False
    headers = {"content-type": "text/plain"}

    def raise_for_status(self) -> None:
        pass

    def iter_bytes(self):
        return iter((b"hello",))

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_parse_connects_to_the_address_it_checked(monkeypatch: pytest.MonkeyPatch) -> None:
    """A name is resolved once and that answer is what gets connected to.

    The DNS server here says "public" the first time and the metadata server
    every time after: handing the *name* to the HTTP client, which resolves it
    again to connect, would reach the second answer.
    """
    import httpx

    getaddrinfo, asked = _resolves_to("93.184.215.14", "169.254.169.254")
    monkeypatch.setattr(parser.socket, "getaddrinfo", getaddrinfo)
    _Recorder.requests = []
    monkeypatch.setattr(httpx, "Client", _Recorder)

    body, _ = parser._download("https://rebind.example:8443/paper.pdf?x=1")

    assert body == b"hello"
    assert asked == ["rebind.example"], "resolved once, not again to connect"
    (request,) = _Recorder.requests
    assert request["url"] == "https://93.184.215.14:8443/paper.pdf?x=1"
    # The site still sees its own name, and the certificate has to match it.
    assert request["headers"]["Host"] == "rebind.example:8443"
    assert request["extensions"] == {"sni_hostname": "rebind.example"}


def test_parse_refuses_a_name_with_any_private_answer(monkeypatch: pytest.MonkeyPatch) -> None:
    import socket

    def getaddrinfo(host, port, *args, **kwargs):
        return [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.215.14", port)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.5", port)),
        ]

    monkeypatch.setattr(parser.socket, "getaddrinfo", getaddrinfo)
    with pytest.raises(parser.ParseError, match="private address"):
        parser._public_address("https://both.example/")


def test_parses_a_real_pdf() -> None:
    import pymupdf

    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((72, 96), "Eigenvalues and eigenvectors", fontsize=18)
    page.insert_text((72, 130), "A scalar is an eigenvalue of A when det(A - I) = 0.", fontsize=11)
    body = document.tobytes()
    document.close()

    result = parser._parse_pdf(body)
    assert result.kind == "pdf"
    assert result.pages == 1
    assert "Eigenvalues" in result.markdown


def test_scanned_pdf_fails_with_an_actionable_message() -> None:
    """An image-only PDF is the most common real failure; the user needs to be
    told it's an OCR problem, not a broken upload."""
    import pymupdf

    document = pymupdf.open()
    document.new_page()
    body = document.tobytes()
    document.close()

    with pytest.raises(parser.ParseError, match="OCR"):
        parser._parse_pdf(body)


def test_parses_html_and_drops_boilerplate() -> None:
    html = b"""<html><head><title>Krebs cycle</title></head><body>
      <nav>Home | About | Subscribe to our newsletter</nav>
      <article><h1>The Krebs cycle</h1>
      <p>The citric acid cycle oxidises acetyl-CoA to carbon dioxide, and it is
      the central hub of aerobic respiration in every eukaryotic cell.</p>
      <p>It yields NADH and FADH2, which feed the electron transport chain and
      ultimately drive the synthesis of ATP inside the mitochondrion.</p></article>
      <footer>Copyright 2026. All rights reserved.</footer></body></html>"""

    result = parser._parse_html(html)
    assert "citric acid cycle" in result.markdown
    assert "newsletter" not in result.markdown
    assert "All rights reserved" not in result.markdown


def test_empty_page_is_an_error_not_empty_markdown() -> None:
    with pytest.raises(parser.ParseError):
        parser._parse_html(b"<html><body></body></html>")


@pytest.mark.parametrize("kind", ["pdf", "text"])
def test_detect_kind_prefers_the_magic_bytes(kind: str) -> None:
    """A bucket that serves everything as application/octet-stream shouldn't
    make a PDF get parsed as HTML."""
    body = b"%PDF-1.7 ..." if kind == "pdf" else b"plain notes"
    detected = parser._detect_kind("application/octet-stream", "https://x/file", body)
    assert detected == ("pdf" if kind == "pdf" else "html")


def test_parse_validates_every_redirect_hop(monkeypatch: pytest.MonkeyPatch) -> None:
    """A public URL that redirects to a private address must not reach it.

    httpx's own `follow_redirects=True` would happily chase this; `_download`
    is written to check `_public_address` again on every hop instead.
    """
    import httpx

    calls = []

    class FakeResponse:
        def __init__(self, url: str) -> None:
            self.status_code = 302
            self.is_redirect = True
            self.headers = {"location": "http://169.254.169.254/secret"}
            self.next_request = httpx.Request("GET", "http://169.254.169.254/secret")

        def raise_for_status(self) -> None:
            pass

        def iter_bytes(self):
            return iter(())

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    class FakeClient:
        def __init__(self, *a, **k) -> None:
            pass

        def stream(self, method, url, headers=None, extensions=None):
            calls.append((str(url), headers["Host"]))
            return FakeResponse(url)

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    monkeypatch.setattr(httpx, "Client", FakeClient)
    getaddrinfo, _asked = _resolves_to("93.184.215.14")
    monkeypatch.setattr(parser.socket, "getaddrinfo", getaddrinfo)

    with pytest.raises(parser.ParseError, match="private address"):
        parser._download("https://example.com/redirects-me")

    assert calls == [("https://93.184.215.14/redirects-me", "example.com")], (
        "should stop at the first hop rather than ever requesting the target"
    )


def test_parse_allows_an_operator_named_private_host(monkeypatch: pytest.MonkeyPatch) -> None:
    """Self-hosted, the app's own container is named in INGEST_ALLOWED_HOSTS
    so PDFs on its disk can be read; that host and only that host is let in."""
    monkeypatch.setattr(parser, "INGEST_ALLOWED_HOSTS", frozenset({"localhost"}))
    # None: connected to by name, since the operator vouched for the name.
    assert parser._public_address("http://localhost:3000/api/files/docs/u/a.pdf") is None
    with pytest.raises(parser.ParseError):
        parser._public_address("http://127.0.0.1/")
    with pytest.raises(parser.ParseError):
        parser._public_address("file://localhost/etc/passwd")
