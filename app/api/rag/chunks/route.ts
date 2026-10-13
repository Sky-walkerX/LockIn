import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as f from "@/lib/http/fields";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "@/lib/rag/embedding-model";
import { liveHashes } from "@/lib/rag/freshness";
import { storeChunks } from "@/lib/rag/store";

// The browser asks `/api/rag/pending` for 20 chunks at a time, which never
// returns more than it's asked for, so real batches sit well under this. The
// cap exists to bound the request body: at 384 dimensions, 100 chunks is
// roughly 800 KB of JSON.
const MAX_BATCH = 100;

const ChunkInputSchema = z.object({
  source: z.enum(["SUBJECT", "MILESTONE", "TASK", "SUBTASK", "RESOURCE", "RESOURCE_DOC"]),
  sourceId: f.id,
  ordinal: z.number().int().min(0).max(1_000_000),
  breadcrumb: z.string().min(1).max(2_000),
  content: z.string().min(1).max(8_000),
  contentHash: z.string().min(1).max(128),
  embedding: z.array(z.number().finite()).length(EMBEDDING_DIMS),
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
 * Writes the browser's embedded chunks through `storeChunks`, which skips any
 * source that was deleted or edited while the batch was being embedded. A
 * batch may be part of a source: a long document is written across several.
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

  const written = await storeChunks(userId, parsed.data.chunks, await liveHashes(userId, parsed.data.chunks));
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

  const [{ count }] = await prisma.$transaction([
    prisma.noteChunk.deleteMany({ where: { userId } }),
    prisma.indexedSource.deleteMany({ where: { userId } }),
  ]);
  return NextResponse.json({ deleted: count });
}
