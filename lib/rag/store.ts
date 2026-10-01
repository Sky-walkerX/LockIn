import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { ChunkSourceType } from "./chunk";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "./embedding-model";
import { sourceKey, type LiveSource } from "./sources";

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

export type ChunkGroup = { live: LiveSource; chunks: EmbeddedChunk[] };

/**
 * Groups chunks by (source, sourceId) and keeps the groups that may be
 * written. A group is dropped when its source record no longer exists, or when
 * its `contentHash` no longer matches the live text: the note was edited while
 * the batch was being embedded, and writing it would mark stale content as
 * indexed so it would never be corrected. Dropping leaves it stale, and the
 * next status check picks it up.
 */
export function acceptedGroups(chunks: EmbeddedChunk[], live: LiveSource[]): ChunkGroup[] {
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
    out.push({ live: entry, chunks: group });
  }
  return out;
}

/**
 * Writes the accepted groups, each one's existing rows deleted and replaced in
 * one transaction (re-indexing never upserts by ordinal, since a shorter
 * re-chunk would leave surplus high-ordinal rows behind). Returns how many
 * chunks were written.
 */
export async function storeChunks(userId: string, chunks: EmbeddedChunk[], live: LiveSource[]): Promise<number> {
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  let written = 0;

  for (const { live: entry, chunks: group } of acceptedGroups(chunks, live)) {
    ops.push(prisma.noteChunk.deleteMany({ where: { userId, source: entry.source, sourceId: entry.sourceId } }));
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
      }),
    );
    written += group.length;
  }

  if (ops.length > 0) await prisma.$transaction(ops);
  return written;
}
