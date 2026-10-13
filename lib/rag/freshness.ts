import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import type { ChunkSourceType } from "./chunk";
import { EMBEDDING_MODEL } from "./embedding-model";
import { loadSources, sourceKey, type LiveSource } from "./sources";

/**
 * What's indexed and what isn't, worked out in the database.
 *
 * It used to be worked out here: every request read the user's whole notebook,
 * extracted PDFs included, chunked all of it and hashed all of it, to learn
 * which few sources had changed. Indexing a notebook asks that question once
 * per twenty passages, so the work grew with the square of the notebook.
 *
 * Postgres can hash text itself, and `IndexedSource` remembers what each
 * source chunked into, so the question is now a join. Text is read only for
 * the sources about to be embedded.
 */

// Every record with text to index, for one user: where it is, and its text.
// The six branches are the six kinds of source (lib/rag/chunk.ts). Everything
// is reached through the user's subjects, as the notebook itself is.
const liveBodies = (userId: string) => Prisma.sql`
  SELECT 'SUBJECT'::"ChunkSource" AS source, s."id" AS "sourceId", s."id" AS "subjectId", s."description" AS body
  FROM "Subject" s WHERE s."userId" = ${userId}
  UNION ALL
  SELECT 'MILESTONE'::"ChunkSource", m."id", m."subjectId", m."notes"
  FROM "Milestone" m JOIN "Subject" s ON s."id" = m."subjectId" WHERE s."userId" = ${userId}
  UNION ALL
  SELECT 'TASK'::"ChunkSource", t."id", t."subjectId", t."description"
  FROM "Task" t JOIN "Subject" s ON s."id" = t."subjectId" WHERE s."userId" = ${userId}
  UNION ALL
  SELECT 'SUBTASK'::"ChunkSource", st."id", t."subjectId", st."notes"
  FROM "Subtask" st JOIN "Task" t ON t."id" = st."taskId" JOIN "Subject" s ON s."id" = t."subjectId"
  WHERE s."userId" = ${userId}
  UNION ALL
  SELECT 'RESOURCE'::"ChunkSource", r."id", r."subjectId", r."note"
  FROM "Resource" r JOIN "Subject" s ON s."id" = r."subjectId" WHERE s."userId" = ${userId}
  UNION ALL
  SELECT 'RESOURCE_DOC'::"ChunkSource", r."id", r."subjectId", r."extracted"
  FROM "Resource" r JOIN "Subject" s ON s."id" = r."subjectId" WHERE s."userId" = ${userId}`;

// Those with something written in them. Titles aren't indexed, so a record
// with an empty body isn't a source at all.
const live = (userId: string) => Prisma.sql`
  SELECT source, "sourceId", "subjectId" FROM (${liveBodies(userId)}) bodies WHERE body ~ '\\S'`;

// The same, with each text's sha256: what lib/rag/chunk.ts's hashContent gives
// for the same string.
const liveHashed = (userId: string) => Prisma.sql`
  SELECT source, "sourceId", "subjectId", encode(sha256(convert_to(body, 'UTF8')), 'hex') AS hash
  FROM (${liveBodies(userId)}) bodies WHERE body ~ '\\S'`;

// Each live source beside what the indexer knows of it. `expected` is how
// many passages its current text makes: -1 when that text hasn't been chunked
// yet, 0 when it's too short to index. `have` is how many of them are stored.
const state = (userId: string) => Prisma.sql`
  SELECT l.source, l."sourceId", l."subjectId", l.hash,
         coalesce(i."chunkCount", -1) AS expected,
         coalesce(have.n, 0) AS have
  FROM (${liveHashed(userId)}) l
  LEFT JOIN "IndexedSource" i
    ON i."source" = l.source AND i."sourceId" = l."sourceId"
   AND i."contentHash" = l.hash AND i."embeddingModel" = ${EMBEDDING_MODEL}
  LEFT JOIN (
    SELECT c."source", c."sourceId", c."contentHash", count(*)::int AS n
    FROM "NoteChunk" c
    WHERE c."userId" = ${userId} AND c."embeddingModel" = ${EMBEDDING_MODEL}
    GROUP BY 1, 2, 3
  ) have ON have."source" = l.source AND have."sourceId" = l."sourceId" AND have."contentHash" = l.hash`;

// Not worth indexing, or all there.
const SETTLED = Prisma.sql`(expected = 0 OR (expected > 0 AND have >= expected))`;

export type IndexStatus = {
  /** Sources that have, or may have, passages to index. */
  total: number;
  indexed: number;
  /** Missing, edited since, embedded by another model, or only part written. */
  stale: number;
  /** Sources with stored passages whose record is gone or now empty. */
  orphaned: number;
};

export async function indexStatus(userId: string): Promise<IndexStatus> {
  const [[counts], [orphans]] = await Promise.all([
    prisma.$queryRaw<{ total: number; indexed: number }[]>`
      SELECT (count(*) FILTER (WHERE expected <> 0))::int AS total,
             (count(*) FILTER (WHERE expected > 0 AND have >= expected))::int AS indexed
      FROM (${state(userId)}) state`,
    prisma.$queryRaw<{ orphaned: number }[]>`
      SELECT count(*)::int AS orphaned FROM (
        SELECT DISTINCT c."source", c."sourceId" FROM "NoteChunk" c WHERE c."userId" = ${userId}
      ) stored
      WHERE NOT EXISTS (
        SELECT 1 FROM (${live(userId)}) l WHERE l.source = stored."source" AND l."sourceId" = stored."sourceId"
      )`,
  ]);
  return { total: counts.total, indexed: counts.indexed, stale: counts.total - counts.indexed, orphaned: orphans.orphaned };
}

type StaleSource = { source: ChunkSourceType; sourceId: string; have: number };

// In a fixed order, so a pass that's interrupted picks up where it stopped.
// The order is the enum's: notes and plan items before whole documents, so a
// notebook is searchable before its textbooks are done.
async function staleSources(userId: string, limit: number): Promise<StaleSource[]> {
  return prisma.$queryRaw<StaleSource[]>`
    SELECT source::text AS source, "sourceId", have FROM (${state(userId)}) state
    WHERE NOT ${SETTLED}
    ORDER BY state.source, "sourceId"
    LIMIT ${limit}`;
}

/** Remembers what a source's text chunked into (see IndexedSource in the schema). */
export async function recordSource(userId: string, source: LiveSource): Promise<void> {
  const seen = { userId, contentHash: source.contentHash, embeddingModel: EMBEDDING_MODEL, chunkCount: source.chunks.length };
  await prisma.indexedSource.upsert({
    where: { source_sourceId: { source: source.source, sourceId: source.sourceId } },
    create: { source: source.source, sourceId: source.sourceId, ...seen },
    update: seen,
  });
}

/** The current hash of each of these sources, by `sourceKey`: the check a
 *  write makes that the text it embedded is still the text there. */
export async function liveHashes(
  userId: string,
  keys: { source: ChunkSourceType; sourceId: string }[],
): Promise<{ source: ChunkSourceType; sourceId: string; subjectId: string; contentHash: string }[]> {
  if (keys.length === 0) return [];
  const wanted = [...new Set(keys.map((k) => sourceKey(k.source, k.sourceId)))];
  return prisma.$queryRaw`
    SELECT source::text AS source, "sourceId", "subjectId", hash AS "contentHash"
    FROM (${liveHashed(userId)}) l
    WHERE (source::text || ':' || "sourceId") = ANY(${wanted}::text[])`;
}

export type PendingChunk = {
  source: ChunkSourceType;
  sourceId: string;
  subjectId: string;
  ordinal: number;
  breadcrumb: string;
  content: string;
  contentHash: string;
};

// How many stale sources one pass looks at, and how many are read at a time.
// A source can be a whole textbook, so they're read a few at a time and only
// until the batch is full.
const SOURCES_PER_PASS = 50;
const SOURCES_PER_READ = 8;
// Passes that found nothing but text too short to index. Each one settles the
// sources it looked at, so the next call starts further along.
const MAX_EMPTY_PASSES = 10;

/**
 * The next passages to embed, up to `limit`: the missing ones of the first
 * stale sources. A long document comes out a batch at a time across calls,
 * the ones already stored left out, so it can be written the same way.
 */
export async function pendingChunks(userId: string, limit: number): Promise<PendingChunk[]> {
  const out: PendingChunk[] = [];

  for (let pass = 0; pass < MAX_EMPTY_PASSES && out.length === 0; pass++) {
    const stale = await staleSources(userId, SOURCES_PER_PASS);
    if (stale.length === 0) break;

    for (let i = 0; i < stale.length && out.length < limit; i += SOURCES_PER_READ) {
      const batch = stale.slice(i, i + SOURCES_PER_READ);
      const loaded = new Map((await loadSources(userId, batch)).map((s) => [sourceKey(s.source, s.sourceId), s]));

      for (const { source, sourceId, have } of batch) {
        if (out.length >= limit) break;
        // Deleted, or emptied, since the list was made.
        const entry = loaded.get(sourceKey(source, sourceId));
        if (!entry) continue;

        await recordSource(userId, entry);
        if (entry.chunks.length === 0) continue;

        const stored =
          have === 0
            ? new Set<number>()
            : new Set(
                (
                  await prisma.noteChunk.findMany({
                    where: { userId, source, sourceId, contentHash: entry.contentHash, embeddingModel: EMBEDDING_MODEL },
                    select: { ordinal: true },
                  })
                ).map((row) => row.ordinal),
              );

        for (const chunk of entry.chunks) {
          if (out.length >= limit) break;
          if (stored.has(chunk.ordinal)) continue;
          out.push({
            source,
            sourceId,
            subjectId: entry.subjectId,
            ordinal: chunk.ordinal,
            breadcrumb: chunk.breadcrumb,
            content: chunk.content,
            contentHash: entry.contentHash,
          });
        }
      }
    }
  }

  return out;
}

/**
 * Deletes what's stored for sources that are gone: a note, task or resource
 * that was deleted, or whose text was cleared. Returns how many passages went.
 */
export async function sweepOrphans(userId: string): Promise<number> {
  const [deleted] = await prisma.$transaction([
    prisma.$executeRaw`
      DELETE FROM "NoteChunk" c
      WHERE c."userId" = ${userId}
        AND NOT EXISTS (SELECT 1 FROM (${live(userId)}) l WHERE l.source = c."source" AND l."sourceId" = c."sourceId")`,
    prisma.$executeRaw`
      DELETE FROM "IndexedSource" i
      WHERE i."userId" = ${userId}
        AND NOT EXISTS (SELECT 1 FROM (${live(userId)}) l WHERE l.source = i."source" AND l."sourceId" = i."sourceId")`,
  ]);
  return deleted;
}
