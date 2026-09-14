import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "@/lib/rag/embedding-model";

/**
 * POST /api/rag/embed
 *
 * A thin, authed proxy in front of the Python ingest service's `/embed`. The
 * browser never talks to that service directly — the shared secret
 * (`INGEST_SECRET`) stays server-side, and a service that only ever hears
 * from this one caller has no CORS surface to configure.
 *
 * This does not make the server "talk to a model": the ingest service does
 * embeddings only, deterministically, with no chat capability — the same
 * boundary that lets `/api/chat/conversations/[id]/prepare` assemble prompts
 * without ever generating a token itself.
 *
 * Deliberately fails soft. `INGEST_URL` unset, the service unreachable, or a
 * mismatched model tag all return 503 rather than 500 — the client
 * (`lib/llm/embedder.ts`) treats "remote embedding unavailable" as "fall back
 * to WebGPU or WASM", so a Cloud Run outage degrades to today's behaviour
 * instead of breaking retrieval.
 */

const RequestSchema = z.object({
  texts: z.array(z.string()).min(1),
  role: z.enum(["query", "passage"]),
});

// Mirrors service/app/config.py's MAX_EMBED_BATCH. Rejecting an oversize batch
// here is cheaper than letting the ingest service do it, and keeps the two
// checks from silently drifting apart in what they allow.
const MAX_BATCH = 128;

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ingestUrl = process.env.INGEST_URL;
  const ingestSecret = process.env.INGEST_SECRET;
  if (!ingestUrl || !ingestSecret) {
    // Not configured is not an error a user caused — it's the expected state
    // for anyone running LockIn without the optional ingest service deployed.
    return NextResponse.json({ error: "Remote embedding is not configured" }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { texts, role } = parsed.data;
  if (texts.length > MAX_BATCH) {
    return NextResponse.json({ error: `At most ${MAX_BATCH} texts per request` }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(new URL("/embed", ingestUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ingestSecret}` },
      body: JSON.stringify({ texts, role }),
      // A hung service shouldn't hang the browser's indexing loop indefinitely —
      // it should fall back promptly.
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return NextResponse.json({ error: "Ingest service unreachable" }, { status: 503 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: `Ingest service returned ${upstream.status}` }, { status: 503 });
  }

  const body = (await upstream.json()) as { vectors: number[][]; model: string; dims: number };

  // The one thing this proxy actually validates: a service redeployed with
  // different weights must fail loudly here, not quietly write vectors from a
  // second vector space into a corpus that assumes there is only one.
  if (body.model !== EMBEDDING_MODEL || body.dims !== EMBEDDING_DIMS) {
    return NextResponse.json(
      { error: `Ingest service model mismatch (${body.model}, ${body.dims}d)` },
      { status: 503 },
    );
  }

  return NextResponse.json({ vectors: body.vectors, model: body.model, dims: body.dims });
}
