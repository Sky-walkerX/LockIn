"""API-surface tests: auth, contracts, and the parser's failure modes."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import parse as parser
from app.config import EMBEDDING_DIMS, EMBEDDING_MODEL, MAX_EMBED_BATCH
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
    ],
    ids=["empty", "bad-role", "over-batch-cap"],
)
def test_embed_rejects_invalid_payloads(client: TestClient, payload: dict) -> None:
    assert client.post("/embed", json=payload, headers=AUTH).status_code == 422


# --- parser ---------------------------------------------------------------


@pytest.mark.parametrize(
    "url",
    [
        "http://169.254.169.254/computeMetadata/v1/",  # GCP metadata server
        "http://localhost:8080/admin",
        "http://127.0.0.1/",
        "http://10.0.0.5/internal",
        "file:///etc/passwd",
    ],
)
def test_parse_refuses_private_and_non_http_urls(url: str) -> None:
    """Resource.url is user-authored, so /parse must not become a reader for
    anything inside the VPC."""
    with pytest.raises(parser.ParseError):
        parser._assert_public_url(url)


def test_parse_allows_a_public_host() -> None:
    parser._assert_public_url("https://example.com/paper.pdf")


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
    is written to check `_assert_public_url` again on every hop instead.
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

        def stream(self, method, url, headers=None):
            calls.append(url)
            return FakeResponse(url)

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    monkeypatch.setattr(httpx, "Client", FakeClient)

    with pytest.raises(parser.ParseError, match="private address"):
        parser._download("https://example.com/redirects-me")

    assert calls == ["https://example.com/redirects-me"], (
        "should stop at the first hop rather than ever requesting the target"
    )
