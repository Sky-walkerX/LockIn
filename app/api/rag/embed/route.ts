import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "@/lib/rag/embedding-model";
import { embedOnServer } from "@/lib/rag/ingest";

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

  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { texts, role } = parsed.data;
  if (texts.length > MAX_BATCH) {
    return NextResponse.json({ error: `At most ${MAX_BATCH} texts per request` }, { status: 400 });
  }

  const result = await embedOnServer(texts, role);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 503 });
  return NextResponse.json({ vectors: result.vectors, model: EMBEDDING_MODEL, dims: EMBEDDING_DIMS });
}
