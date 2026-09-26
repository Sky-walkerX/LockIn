"""Request and response schemas.

The wire format is shared with app/api/rag/embed/route.ts and
app/api/resources/[id]/ingest/route.ts on the Next.js side; changing a field
here means changing it there.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.config import EMBEDDING_DIMS, EMBEDDING_MODEL, MAX_EMBED_BATCH


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1, max_length=MAX_EMBED_BATCH)
    role: Literal["query", "passage"]


class EmbedResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    vectors: list[list[float]]
    # Echoed so the caller can assert it got what it expected. The Next.js proxy
    # checks both against its own constants before writing anything: a service
    # deployed with different weights should fail loudly, not quietly poison the
    # corpus with vectors from another space.
    model: str = EMBEDDING_MODEL
    dims: int = EMBEDDING_DIMS


class ParseRequest(BaseModel):
    url: str
    kind: Literal["pdf", "html", "text", "auto"] = "auto"


class ParseResponse(BaseModel):
    markdown: str
    title: str | None = None
    pages: int | None = None
    chars: int
    kind: Literal["pdf", "html", "text"]
    truncated: bool = False


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: Literal["ok"]
    model: str = EMBEDDING_MODEL
    dims: int = EMBEDDING_DIMS
    model_loaded: bool
