import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { EMBEDDING_DIMS } from "@/lib/rag/embedding-model";
import { listScorableChunks } from "@/lib/rag/sources";
import { topK } from "@/lib/rag/similarity";
import { toSemanticHits } from "@/lib/search/semantic-hits";

// The browser embeds the query (it already holds, or reaches, the embedder);
// the server scores it against the user's stored chunks. Same brute-force
// dot product Ask uses — see lib/rag/similarity.ts for why that's enough.
const Body = z.object({ queryEmbedding: z.array(z.number().finite()).length(EMBEDDING_DIMS) });

// Enough candidates that deduping to one per source still leaves a full list.
const CANDIDATES = 40;

// POST /api/search/semantic { queryEmbedding } - notes and documents by meaning
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const chunks = await listScorableChunks(userId, []);
  const scored = topK(parsed.data.queryEmbedding, chunks, (c) => c.embedding, CANDIDATES);
  const hits = toSemanticHits(
    scored.map(({ item, score }) => ({ item: { ...item, color: item.subjectColor }, score })),
  );
  return NextResponse.json(hits);
}
