import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { EMBEDDING_DIMS, EMBEDDING_MODEL, listLiveSources } from "@/lib/rag/sources";
import { storeChunks } from "@/lib/rag/store";

// The browser asks `/api/rag/pending` for 20 chunks at a time and can overshoot
// by one source's worth, so real batches sit well under this. The cap exists to
// bound the request body: at 384 dimensions, 100 chunks is roughly 800 KB of
// JSON.
const MAX_BATCH = 100;

const ChunkInputSchema = z.object({
  source: z.enum(["SUBJECT", "MILESTONE", "TASK", "SUBTASK", "RESOURCE", "RESOURCE_DOC"]),
  sourceId: z.string().min(1),
  ordinal: z.number().int().min(0),
  breadcrumb: z.string().min(1),
  content: z.string().min(1),
  contentHash: z.string().min(1),
  embedding: z.array(z.number()).length(EMBEDDING_DIMS),
});

// There is exactly one embedding model, so both of these are constants
// wearing request-body clothing. Pinning them keeps a client from declaring
// 100,000-dimension vectors and making the server allocate them: the batch cap
// alone bounds the row count, not the payload size.
const PostSchema = z.object({
  model: z.literal(EMBEDDING_MODEL),
  dims: z.literal(EMBEDDING_DIMS),
  chunks: z.array(ChunkInputSchema).min(1).max(MAX_BATCH),
});

/**
 * POST /api/rag/chunks
 *
 * Writes the browser's embedded chunks through `storeChunks`, which replaces
 * each source's rows and skips any source that was deleted or edited while
 * the batch was being embedded.
 *
 * `content` is trusted only within the caller's own account: every row is
 * scoped by `userId`, so the worst a tampered client achieves is poisoning
 * its own retrieval.
 */
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = PostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const written = await storeChunks(userId, parsed.data.chunks, await listLiveSources(userId));
  return NextResponse.json({ written });
}

/**
 * DELETE /api/rag/chunks
 *
 * Drops every chunk for the user, for a full rebuild (an embedding model
 * change, or the user asking for one from the settings sheet).
 */
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await prisma.noteChunk.deleteMany({ where: { userId } });
  return NextResponse.json({ deleted: count });
}
