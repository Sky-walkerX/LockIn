"use client";

import { EMBEDDING_DIMS } from "@/lib/rag/embedding-model";

/**
 * The remote embedder — LockIn's own ingest service, reached through
 * `/api/rag/embed` (never called directly; see that route's doc comment for
 * why). Same vector space as the WebGPU and WASM paths: the service runs the
 * identical fp32 Snowflake weights with CLS pooling, so a corpus embedded
 * remotely stays valid if the user later opens LockIn somewhere that embeds
 * locally instead.
 *
 * This exists because the other two paths have a browser dependent on them:
 * WebGPU needs `maxStorageBuffersPerShaderStage >= 10` (Firefox reports 9,
 * Safari mostly doesn't have it, mobile mostly doesn't either), and WASM is
 * "slower by an order of magnitude" per `wasm-embedder.ts`. This one needs
 * nothing from the browser and no multi-hundred-megabyte download — it's
 * tried first in `embedder.ts` for exactly that reason.
 */

type EmbedResponse = { vectors: number[][]; model: string; dims: number };

function checkVector(vector: number[]): number[] {
  if (vector.length !== EMBEDDING_DIMS) {
    throw new Error(`Remote embedder returned ${vector.length} dimensions, expected ${EMBEDDING_DIMS}.`);
  }
  return vector;
}

async function embed(texts: string[], role: "query" | "passage"): Promise<number[][]> {
  const response = await fetch("/api/rag/embed", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, role }),
  });

  if (!response.ok) {
    // Callers (`embedder.ts`'s probe, and `getEmbedder` itself) treat a thrown
    // error here as "this backend isn't available", not as a user-facing
    // failure — the whole point of trying remote first is that it can be
    // absent without anything breaking.
    throw new Error(`Remote embed failed (${response.status})`);
  }

  const body = (await response.json()) as EmbedResponse;
  return body.vectors.map(checkVector);
}

export async function remoteEmbedPassages(texts: string[]): Promise<number[][]> {
  return embed(texts, "passage");
}

export async function remoteEmbedQuery(query: string): Promise<number[]> {
  const [vector] = await embed([query], "query");
  return vector;
}

/**
 * Whether the remote backend is worth trying. A single lightweight probe
 * against `/api/rag/embed/health`, which itself just checks that `INGEST_URL`
 * is configured and the service answers — it does not run the model, so a
 * cold Cloud Run container still reports available while it's spinning up.
 */
export async function checkRemote(): Promise<boolean> {
  try {
    const response = await fetch("/api/rag/embed/health", { credentials: "include" });
    if (!response.ok) return false;
    const body = (await response.json()) as { available: boolean };
    return body.available;
  } catch {
    return false;
  }
}
