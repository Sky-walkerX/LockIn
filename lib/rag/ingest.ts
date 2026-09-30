import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "@/lib/rag/embedding-model";

export type EmbedResult = { ok: true; vectors: number[][] } | { ok: false; reason: string };

/**
 * Embed texts on the Python ingest service, server to server. Fails soft: not
 * configured, unreachable, an error status or a different model all come back
 * as `ok: false`, so callers fall back (to the browser's own embedder, or to
 * keyword search) instead of breaking.
 */
export async function embedOnServer(texts: string[], role: "query" | "passage"): Promise<EmbedResult> {
  const ingestUrl = process.env.INGEST_URL;
  const ingestSecret = process.env.INGEST_SECRET;
  // Not configured is not an error a user caused — it's the expected state for
  // anyone running LockIn without the optional ingest service deployed.
  if (!ingestUrl || !ingestSecret) return { ok: false, reason: "Remote embedding is not configured" };

  let upstream: Response;
  try {
    upstream = await fetch(new URL("/embed", ingestUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ingestSecret}` },
      body: JSON.stringify({ texts, role }),
      // A hung service shouldn't hang the caller indefinitely; it should fall back promptly.
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { ok: false, reason: "Ingest service unreachable" };
  }
  if (!upstream.ok) return { ok: false, reason: `Ingest service returned ${upstream.status}` };

  const body = (await upstream.json()) as { vectors: number[][]; model: string; dims: number };
  // A service redeployed with different weights must fail loudly here, not
  // quietly mix a second vector space into a corpus that assumes there is one.
  if (body.model !== EMBEDDING_MODEL || body.dims !== EMBEDDING_DIMS) {
    return { ok: false, reason: `Ingest service model mismatch (${body.model}, ${body.dims}d)` };
  }
  return { ok: true, vectors: body.vectors };
}
