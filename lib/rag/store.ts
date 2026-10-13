import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { ChunkSourceType } from "./chunk";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "./embedding-model";
import { sourceKey } from "./sources";

/** A chunk with its vector, as the browser posts it to `/api/rag/chunks` or
 *  the server's own indexer (`index-note.ts`) produces it. */
export type EmbeddedChunk = {
  source: ChunkSourceType;
  sourceId: string;
  ordinal: number;
  breadcrumb: string;
  content: string;
  contentHash: string;
  embedding: number[];
};

/** A source as it stands now: where it files, what its text hashes to, and
 *  how many passages that text chunks into. */
export type LiveRef = { source: ChunkSourceType; sourceId: string; subjectId: string; contentHash: string; chunkCount: number };

export type ChunkGroup = { live: LiveRef; chunks: EmbeddedChunk[] };

/**
 * Groups chunks by (source, sourceId) and keeps the groups that may be
 * written. A group is dropped when its source record no longer exists, or when
 * its `contentHash` no longer matches the live text: the note was edited while
 * the batch was being embedded, and writing it would store passages of text
 * that's gone. Dropping leaves it stale, and the next pass picks it up.
 *
 * It's also dropped when it numbers a passage the text doesn't have. A source
 * is written across several requests, so nothing else stops a caller sending
 * passage after passage for one note: the count the server made when it
 * chunked the text is the ceiling on how many rows that note can hold.
 */
export function acceptedGroups(chunks: EmbeddedChunk[], live: LiveRef[]): ChunkGroup[] {
  const liveByKey = new Map(live.map((l) => [sourceKey(l.source, l.sourceId), l]));
  const groups = new Map<string, EmbeddedChunk[]>();
  for (const chunk of chunks) {
    const key = sourceKey(chunk.source, chunk.sourceId);
    const group = groups.get(key);
    if (group) group.push(chunk);
    else groups.set(key, [chunk]);
  }
  const out: ChunkGroup[] = [];
  for (const [key, group] of groups) {
    const entry = liveByKey.get(key);
    if (!entry) continue;
    if (group.some((c) => c.contentHash !== entry.contentHash)) continue;
    if (group.some((c) => c.ordinal >= entry.chunkCount)) continue;
    out.push({ live: entry, chunks: group });
  }
  return out;
}

/**
 * Writes the accepted groups in one transaction. A group needn't be a whole
 * source: a long document arrives a batch at a time. So a write clears what
 * it replaces and nothing else: the source's passages from any earlier text
 * or model (a shorter re-chunk would otherwise leave its surplus high-ordinal
 * rows behind), and the ordinals in this batch, so sending one twice is
 * harmless. Returns how many chunks were written.
 */
export async function storeChunks(userId: string, chunks: EmbeddedChunk[], live: LiveRef[]): Promise<number> {
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  let written = 0;
  for (const { live: entry, chunks: group } of acceptedGroups(chunks, live)) {
    ops.push(
      prisma.noteChunk.deleteMany({
        where: {
          userId,
          source: entry.source,
          sourceId: entry.sourceId,
          OR: [
            { contentHash: { not: entry.contentHash } },
            { embeddingModel: { not: EMBEDDING_MODEL } },
            { ordinal: { in: group.map((c) => c.ordinal) } },
          ],
        },
      }),
    );
    ops.push(
      prisma.noteChunk.createMany({
        data: group.map((c) => ({
          userId,
          subjectId: entry.subjectId,
          source: c.source,
          sourceId: c.sourceId,
          ordinal: c.ordinal,
          breadcrumb: c.breadcrumb,
          content: c.content,
          contentHash: c.contentHash,
          embedding: c.embedding,
          embeddingModel: EMBEDDING_MODEL,
          dims: EMBEDDING_DIMS,
        })),
        // Two tabs indexing at once may send the same passage.
        skipDuplicates: true,
      }),
    );
    written += group.length;
  }
  if (ops.length > 0) await prisma.$transaction(ops);
  return written;
}
