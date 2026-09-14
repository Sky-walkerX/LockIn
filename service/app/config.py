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
FETCH_TIMEOUT_SECONDS = 120.0
