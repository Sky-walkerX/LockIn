"""LockIn's ingest service.

Two endpoints, no state, no database. The browser never calls this directly —
Next.js proxies every request — which is what keeps the shared secret server-side
and means there is no CORS configuration here at all.

Both endpoints do bounded work: a fixed number of documents are read and a
fixed number of batches embedded at a time (app/config.py), and a document is
read in a process that's stopped if it takes too long (app/isolate.py).
"""

from __future__ import annotations

import hmac
import logging
from contextlib import asynccontextmanager

import anyio
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app import parse as parser
from app.config import (
    EMBED_CONCURRENCY,
    EMBEDDING_DIMS,
    EMBEDDING_MODEL,
    INGEST_SECRET,
    PARSE_CONCURRENCY,
    PARSE_QUEUE_SECONDS,
)
from app.embed import embedder
from app.isolate import parse_isolated
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
PUBLIC_PATHS = {"/health"}


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

    # Made here, inside the running event loop they belong to.
    app.state.parse_slots = anyio.Semaphore(PARSE_CONCURRENCY)
    app.state.embed_slots = anyio.CapacityLimiter(EMBED_CONCURRENCY)
    yield


# No /docs, /redoc or /openapi.json: nothing but the Next.js server calls
# this, and on a public URL those pages would describe it to anyone.
app = FastAPI(title="LockIn ingest", version="0.1.0", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


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
    # A batch waits its turn here: they're short, and queueing them keeps
    # memory at a few batches' worth however many arrive together.
    vectors = await anyio.to_thread.run_sync(
        embedder.embed, request.texts, request.role, limiter=app.state.embed_slots
    )
    return EmbedResponse(vectors=vectors)


@app.post("/parse", response_model=ParseResponse)
async def parse_document(request: ParseRequest) -> ParseResponse:
    # A document doesn't queue for long. Each one can take a minute or more,
    # and a caller that waited behind several would time out with no answer;
    # better to be told the service is busy while there's time to say so.
    slots: anyio.Semaphore = app.state.parse_slots
    with anyio.move_on_after(PARSE_QUEUE_SECONDS) as waiting:
        await slots.acquire()
    if waiting.cancelled_caught:
        raise HTTPException(
            status_code=503,
            detail="The extraction service is busy reading other documents. Try again in a minute.",
            headers={"Retry-After": "60"},
        )

    try:
        # In a thread so the event loop is free, and from there in a child
        # process so it can be stopped (app/isolate.py). `abandon_on_cancel`
        # stays off: the slot is held until the child is really gone.
        result = await anyio.to_thread.run_sync(parse_isolated, request.url, request.kind)
    except parser.ParseError as error:
        # 422, not 500: these are all "this document can't be read" — a scanned
        # PDF, a dead link, a page with no article text — and the Next.js side
        # turns them into an `ingestError` the user can act on.
        raise HTTPException(status_code=422, detail=str(error)) from error
    finally:
        slots.release()

    return ParseResponse(
        markdown=result.markdown,
        title=result.title,
        pages=result.pages,
        chars=len(result.markdown),
        kind=result.kind,
        truncated=result.truncated,
    )
