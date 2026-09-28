# syntax=docker/dockerfile:1

# Builder: resolves deps and bakes the model weights into a layer that only
# invalidates when the model or the pinned deps actually change.
FROM python:3.12-slim AS builder

RUN pip install --no-cache-dir uv

# Built at /app, not /build: uv writes each console-script's shebang as an
# absolute path to this stage's interpreter (e.g. `#!/build/.venv/bin/python`),
# and `exec` honours that literally — it does not fall back to PATH. Building
# where the runtime stage will actually copy it to is what keeps `uvicorn`
# executable after the copy, instead of failing with "no such file or
# directory" against a path that only ever existed in this stage.
WORKDIR /app
COPY pyproject.toml uv.lock* ./
COPY app ./app
RUN uv sync --frozen --no-dev --no-editable 2>/dev/null || uv sync --no-dev --no-editable

COPY scripts ./scripts
# Baked at build time, not fetched at boot — see scripts/fetch_model.py's
# module docstring for why a cold start must never depend on Hugging Face.
ENV MODEL_DIR=/app/models/arctic-embed-s
RUN uv run python scripts/fetch_model.py

# Runtime: no uv, no build toolchain, no HF cache — just the venv, the code,
# and the weights.
FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
# libglib2.0-0 is PyMuPDF's one real shared-library dependency on slim Debian.

RUN useradd --create-home --uid 1000 app
WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/models /models
COPY app ./app

ENV PATH="/app/.venv/bin:${PATH}" \
    MODEL_DIR=/models/arctic-embed-s \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=2

USER app
EXPOSE 8080

# `INGEST_SECRET` is required and unset here on purpose (app/main.py refuses
# to boot without it) — it is injected at deploy time from Secret Manager,
# never baked into the image.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
