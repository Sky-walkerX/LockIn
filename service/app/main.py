"""LockIn's ingest service.

Two endpoints, no state, no database. The browser never calls this directly —
Next.js proxies every request — which is what keeps the shared secret server-side
and means there is no CORS configuration here at all.
"""

from __future__ import annotations

import hmac
import logging
from contextlib import asynccontextmanager

import anyio
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app import parse as parser
from app.config import EMBEDDING_DIMS, EMBEDDING_MODEL, INGEST_SECRET
from app.embed import embedder
from app.models import (
    EmbedRequest,
    EmbedResponse,
    HealthResponse,
    ParseRequest,
    ParseResponse,
)

logger = logging.getLogger("lockin.ingest")

# /health is deliberately open: Cloud Run's own probes hit it, and the Next.js
# side pings it to warm a cold container when the Ask panel opens. It reveals
# nothing a caller couldn't guess from this repo.
PUBLIC_PATHS = {"/health", "/openapi.json", "/docs", "/redoc"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load the weights before the port opens.

    Cloud Run routes the first request as soon as the container listens, so
    loading lazily would just move the ~2 s model load into a user-visible
    request instead of into the startup the platform already waits on.
    """
    if not INGEST_SECRET:
        # Refusing to boot is the right failure: the alternative is an
        # unauthenticated public endpoint that looks like it's working.
        raise RuntimeError("INGEST_SECRET is not set; refusing to start.")

    logger.info("Loading %s…", EMBEDDING_MODEL)
    await anyio.to_thread.run_sync(embedder.load)
    logger.info("Model ready (%d dims).", EMBEDDING_DIMS)
    yield


app = FastAPI(title="LockIn ingest", version="0.1.0", lifespan=lifespan)


@app.middleware("http")
async def require_shared_secret(request: Request, call_next):
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    header = request.headers.get("authorization", "")
    token = header[7:] if header.lower().startswith("bearer ") else ""
    # compare_digest, not ==, so a wrong token can't be recovered a byte at a
    # time from response timings.
    if not token or not hmac.compare_digest(token, INGEST_SECRET):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    return await call_next(request)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=embedder.is_loaded)


@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest) -> EmbedResponse:
    # onnxruntime releases the GIL, but the call is still CPU-bound for tens of
    # milliseconds; off the event loop it goes, so one batch can't stall the
    # health probe that Cloud Run uses to decide this container is alive.
    vectors = await anyio.to_thread.run_sync(embedder.embed, request.texts, request.role)
    return EmbedResponse(vectors=vectors)


@app.post("/parse", response_model=ParseResponse)
async def parse_document(request: ParseRequest) -> ParseResponse:
    try:
        result = await anyio.to_thread.run_sync(parser.parse, request.url, request.kind)
    except parser.ParseError as error:
        # 422, not 500: these are all "this document can't be read" — a scanned
        # PDF, a dead link, a page with no article text — and the Next.js side
        # turns them into an `ingestError` the user can act on.
        raise HTTPException(status_code=422, detail=str(error)) from error

    return ParseResponse(
        markdown=result.markdown,
        title=result.title,
        pages=result.pages,
        chars=len(result.markdown),
        kind=result.kind,
        truncated=result.truncated,
    )
