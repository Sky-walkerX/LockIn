import { listScorableChunks } from "@/lib/rag/sources";
import { topK } from "@/lib/rag/similarity";
import { toSemanticHits, type SemanticHit } from "@/lib/search/semantic-hits";

// Enough candidates that deduping to one per source still leaves a full list.
const CANDIDATES = 40;

/**
 * The user's notes and documents ranked by meaning against an already-embedded
 * query. Same brute-force dot product Ask uses (see lib/rag/similarity.ts for
 * why that's enough). Used by /api/search/semantic.
 */
export async function searchSemantic(userId: string, queryEmbedding: number[], limit?: number): Promise<SemanticHit[]> {
  const chunks = await listScorableChunks(userId, []);
  const scored = topK(queryEmbedding, chunks, (c) => c.embedding, CANDIDATES);
  return toSemanticHits(
    scored.map(({ item, score }) => ({ item: { ...item, color: item.subjectColor }, score })),
    limit ? { limit } : undefined,
  );
}
