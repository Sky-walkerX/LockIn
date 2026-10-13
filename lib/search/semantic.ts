import { rankChunks } from "@/lib/rag/sources";
import { toSemanticHits, type SemanticHit } from "@/lib/search/semantic-hits";

// A result is a note or document shown at its best passage, so one passage
// per source, and enough of them that the floor still leaves a full list.
const CANDIDATES = 40;

/**
 * The user's notes and documents ranked by meaning against an already-embedded
 * query (see rankChunks in lib/rag/sources.ts for how they're scored). Shared
 * by /api/search/semantic and the MCP server.
 */
export async function searchSemantic(userId: string, queryEmbedding: number[], limit?: number): Promise<SemanticHit[]> {
  const ranked = await rankChunks(userId, queryEmbedding, { limit: CANDIDATES, perSource: 1 });
  return toSemanticHits(
    ranked.map((chunk) => ({ item: { ...chunk, color: chunk.subjectColor }, score: chunk.score })),
    limit ? { limit } : undefined,
  );
}
