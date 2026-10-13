"""Runtime configuration, all from the environment.

Kept in one module so the Dockerfile, the tests and the Cloud Run deploy have a
single list to agree on.
"""

import os
from pathlib import Path

# Mirrors lib/rag/embedding-model.ts. These are not configurable: LockIn has
# exactly one vector space, and a chunk's stored `embeddingModel` tag is what
# retrieval filters by. Changing either here without changing it there silently
# produces vectors that never get scored.
EMBEDDING_MODEL = "snowflake-arctic-embed-s"
EMBEDDING_DIMS = 384
ONNX_EMBEDDING_REPO = "Snowflake/snowflake-arctic-embed-s"

# Mirrors lib/llm/embed-input.ts. Arctic-embed is asymmetric; omitting this on
# the query path doesn't error, it just quietly costs recall.
QUERY_PREFIX = "Represent this sentence for searching relevant passages:"

# BERT's positional limit. Chunks are capped at 1600 chars upstream
# (lib/rag/chunk.ts HARD_MAX), which is comfortably inside this.
MAX_SEQUENCE_LENGTH = 512

# Where the weights live. Baked into the image at build time so a cold start
# never waits on a Hugging Face download.
MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/models/arctic-embed-s"))

# Hostnames /parse may fetch even though they resolve to a private address.
# Empty by default. A self-hosted docker compose sets it to the app's service
# name ("app") so the parser can read PDFs the app stores on its own disk;
# nothing else on the private network becomes reachable.
INGEST_ALLOWED_HOSTS = frozenset(
    h.strip().lower() for h in os.environ.get("INGEST_ALLOWED_HOSTS", "").split(",") if h.strip()
)

# Shared secret with the Next.js proxy. The browser never calls this service
# directly, so this is the only credential it needs.
INGEST_SECRET = os.environ.get("INGEST_SECRET", "")

# Batch ceiling per /embed request. The Next.js side sends at most
# MAX_BATCH (100) chunks, so this is headroom, not a constraint on callers.
MAX_EMBED_BATCH = 128

# /parse guardrails. A request that would blow past these is rejected with a
# clear message rather than left to OOM the container.
MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024
MAX_PDF_PAGES = 1200
MAX_MARKDOWN_CHARS = 2 * 1024 * 1024
# For each step of a fetch (connecting, each read), not the whole of it. The
# whole of it is bounded by PARSE_TIMEOUT_SECONDS below.
FETCH_TIMEOUT_SECONDS = 30.0

# The longest one text sent to /embed may be. A chunk is at most 1,600
# characters with its breadcrumb in front (lib/rag/chunk.ts) and the Next.js
# proxy stops at 8,000, so this is headroom; it's here so the tokenizer is
# never handed megabytes to cut down to 512 tokens.
MAX_EMBED_CHARS = 16_000
MAX_URL_CHARS = 2_000


def _positive(name: str, default: float) -> float:
    try:
        value = float(os.environ.get(name, default))
    except ValueError:
        return default
    return value if value > 0 else default


# How many documents are read at once, and how many embedding batches run at
# once. A parse can hold a 50 MB download and its PDF in memory and a core for
# a minute; left unbounded, a handful of textbooks sent together would take the
# container down. Raise these on a machine with the memory and cores for it.
PARSE_CONCURRENCY = int(_positive("PARSE_CONCURRENCY", 2))
EMBED_CONCURRENCY = int(_positive("EMBED_CONCURRENCY", 2))

# A document that takes longer than this to fetch and read is stopped. Under
# the 150 s the Next.js side waits, so the user is told why. And how long a
# request waits for a free slot before it's told the service is busy.
PARSE_TIMEOUT_SECONDS = _positive("PARSE_TIMEOUT_SECONDS", 140)
PARSE_QUEUE_SECONDS = _positive("PARSE_QUEUE_SECONDS", 20)
