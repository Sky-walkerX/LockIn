import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { chunkSource, hashContent, type Chunk, type ChunkSourceType } from "./chunk";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "./embedding-model";
import type { PageRef } from "@/lib/chat/refs";
import { notReplacedSql } from "@/lib/notes/status";

export { EMBEDDING_DIMS, EMBEDDING_MODEL };

/**
 * The records that get chunked and embedded, read for indexing, and the
 * passages ranked for a query. Every read is filtered by `userId`. Which
 * sources need indexing is decided in `freshness.ts`, without reading them.
 */

export type LiveSource = {
  source: ChunkSourceType;
  sourceId: string;
  subjectId: string;
  subjectTitle: string;
  milestoneTitle?: string | null;
  taskTitle?: string | null;
  subtaskTitle?: string | null;
  resourceTitle?: string | null;
  text: string;
  contentHash: string;
  /** What the text chunks into. Empty when it's too short to index: "Read
   *  chapter 3" is an ordinary task description that makes no passage. */
  chunks: Chunk[];
};

export function sourceKey(source: ChunkSourceType, sourceId: string): string {
  return `${source}:${sourceId}`;
}

const SUBJECT_TITLE = { select: { id: true, title: true } } as const;

/**
 * These sources with their text, chunked: the ones named that still exist,
 * are the user's, and have something written in them. Reading text is the
 * expensive part of indexing (a source can be a whole textbook), so this is
 * called for the few sources about to be embedded and never for the notebook.
 */
export async function loadSources(userId: string, keys: { source: ChunkSourceType; sourceId: string }[]): Promise<LiveSource[]> {
  const ids = (source: ChunkSourceType) => [...new Set(keys.filter((k) => k.source === source).map((k) => k.sourceId))];
  const [subjectIds, noteIds, taskIds, subtaskIds, resourceIds, documentIds] = [
    ids("SUBJECT"),
    ids("MILESTONE"),
    ids("TASK"),
    ids("SUBTASK"),
    ids("RESOURCE"),
    ids("RESOURCE_DOC"),
  ];

  const [subjects, notes, tasks, subtasks, resources, documents] = await Promise.all([
    subjectIds.length
      ? prisma.subject.findMany({ where: { id: { in: subjectIds }, userId }, select: { id: true, title: true, description: true } })
      : [],
    noteIds.length
      ? prisma.milestone.findMany({
          where: { id: { in: noteIds }, subject: { userId } },
          select: { id: true, title: true, notes: true, subject: SUBJECT_TITLE },
        })
      : [],
    taskIds.length
      ? prisma.task.findMany({
          where: { id: { in: taskIds }, subject: { userId } },
          select: { id: true, title: true, description: true, subject: SUBJECT_TITLE, milestone: { select: { title: true } } },
        })
      : [],
    subtaskIds.length
      ? prisma.subtask.findMany({
          where: { id: { in: subtaskIds }, task: { subject: { userId } } },
          select: {
            id: true,
            title: true,
            notes: true,
            task: { select: { title: true, subject: SUBJECT_TITLE, milestone: { select: { title: true } } } },
          },
        })
      : [],
    resourceIds.length
      ? prisma.resource.findMany({
          where: { id: { in: resourceIds }, subject: { userId } },
          select: { id: true, title: true, note: true, subject: SUBJECT_TITLE },
        })
      : [],
    documentIds.length
      ? prisma.resource.findMany({
          where: { id: { in: documentIds }, subject: { userId } },
          select: { id: true, title: true, extracted: true, subject: SUBJECT_TITLE },
        })
      : [],
  ]);

  const out: LiveSource[] = [];
  const push = (entry: Omit<LiveSource, "contentHash" | "chunks" | "text"> & { text: string | null }) => {
    if (!entry.text?.trim()) return;
    const source = { ...entry, text: entry.text };
    out.push({ ...source, contentHash: hashContent(source.text), chunks: chunkSource(source) });
  };

  for (const s of subjects) {
    push({ source: "SUBJECT", sourceId: s.id, subjectId: s.id, subjectTitle: s.title, text: s.description });
  }
  for (const n of notes) {
    push({ source: "MILESTONE", sourceId: n.id, subjectId: n.subject.id, subjectTitle: n.subject.title, milestoneTitle: n.title, text: n.notes });
  }
  for (const t of tasks) {
    push({
      source: "TASK",
      sourceId: t.id,
      subjectId: t.subject.id,
      subjectTitle: t.subject.title,
      milestoneTitle: t.milestone?.title ?? null,
      taskTitle: t.title,
      text: t.description,
    });
  }
  for (const st of subtasks) {
    push({
      source: "SUBTASK",
      sourceId: st.id,
      subjectId: st.task.subject.id,
      subjectTitle: st.task.subject.title,
      milestoneTitle: st.task.milestone?.title ?? null,
      taskTitle: st.task.title,
      subtaskTitle: st.title,
      text: st.notes,
    });
  }
  for (const r of resources) {
    push({ source: "RESOURCE", sourceId: r.id, subjectId: r.subject.id, subjectTitle: r.subject.title, resourceTitle: r.title, text: r.note });
  }
  // The extracted document is a separate source from the note above (see the
  // schema comment on `Resource.extracted`): the same resource id under a
  // different `source`, so the two hash and re-index independently.
  for (const d of documents) {
    push({
      source: "RESOURCE_DOC",
      sourceId: d.id,
      subjectId: d.subject.id,
      subjectTitle: d.subject.title,
      resourceTitle: d.title,
      text: d.extracted,
    });
  }

  return out;
}

export type RankedChunk = {
  subjectId: string;
  subjectTitle: string;
  subjectColor: string | null;
  source: ChunkSourceType;
  sourceId: string;
  ordinal: number;
  breadcrumb: string;
  content: string;
  /** Dot product with the query; vectors are normalised, so it's the cosine. */
  score: number;
  /** The page a passage is cited by: its note's or resource's. A plan task's
   *  passage cites the note it sits under; one with no note has no page. */
  ref?: PageRef | null;
};

const NOTE_REF_SELECT = {
  id: true,
  page: true,
  title: true,
  subject: { select: { id: true, title: true, isInbox: true } },
} as const;

type NoteRow = { id: string; page: number | null; title: string; subject: { id: string; title: string; isInbox: boolean } };

function noteRef(note: NoteRow | null | undefined): PageRef | null {
  if (!note || note.page == null) return null;
  return {
    page: note.page,
    kind: "note",
    id: note.id,
    subjectId: note.subject.id,
    subjectTitle: note.subject.title,
    title: note.title,
    inbox: note.subject.isInbox,
  };
}

/** The page each chunk's source is cited by, keyed by `sourceKey`. Four reads
 *  at most, run together, and only for the sources actually present. */
async function pageRefs(userId: string, rows: { source: ChunkSourceType; sourceId: string }[]): Promise<Map<string, PageRef | null>> {
  const ids = (...sources: ChunkSourceType[]) => [...new Set(rows.filter((r) => sources.includes(r.source)).map((r) => r.sourceId))];
  const [noteIds, taskIds, subtaskIds, resourceIds] = [ids("MILESTONE"), ids("TASK"), ids("SUBTASK"), ids("RESOURCE", "RESOURCE_DOC")];

  const [notes, tasks, subtasks, resources] = await Promise.all([
    noteIds.length ? prisma.milestone.findMany({ where: { id: { in: noteIds }, subject: { userId } }, select: NOTE_REF_SELECT }) : [],
    taskIds.length
      ? prisma.task.findMany({ where: { id: { in: taskIds }, userId }, select: { id: true, milestone: { select: NOTE_REF_SELECT } } })
      : [],
    subtaskIds.length
      ? prisma.subtask.findMany({
          where: { id: { in: subtaskIds }, task: { userId } },
          select: { id: true, task: { select: { milestone: { select: NOTE_REF_SELECT } } } },
        })
      : [],
    resourceIds.length
      ? prisma.resource.findMany({
          where: { id: { in: resourceIds }, userId },
          select: { id: true, page: true, title: true, subject: { select: { id: true, title: true, isInbox: true } } },
        })
      : [],
  ]);

  const out = new Map<string, PageRef | null>();
  for (const n of notes) out.set(sourceKey("MILESTONE", n.id), noteRef(n));
  for (const t of tasks) out.set(sourceKey("TASK", t.id), noteRef(t.milestone));
  for (const s of subtasks) out.set(sourceKey("SUBTASK", s.id), noteRef(s.task.milestone));
  for (const r of resources) {
    const ref: PageRef | null =
      r.page == null
        ? null
        : { page: r.page, kind: "resource", id: r.id, subjectId: r.subject.id, subjectTitle: r.subject.title, title: r.title, inbox: r.subject.isInbox };
    out.set(sourceKey("RESOURCE", r.id), ref);
    out.set(sourceKey("RESOURCE_DOC", r.id), ref);
  }
  return out;
}

/**
 * The user's passages closest in meaning to an embedded query, best first.
 *
 * Postgres does the scoring and hands back only the winners. Reading every
 * vector into this process to score it here cost 3 KB a passage per query and
 * held the event loop while it ran: 4 seconds, for every user of the
 * instance, on a notebook of 26,000 passages. The same scan in SQL is a sixth
 * of that and runs in the database. Past a few hundred thousand passages per
 * user this wants pgvector, which the stored vectors can move to as they are.
 *
 * A note that a witnessed note replaces isn't scored: Ask and search answer
 * from the page that's true now, not from the one it retired.
 *
 * Only the current embedding model's rows are scored, so a stale vector space
 * is never ranked alongside the current one. `perSource` caps how many
 * passages one note or document may contribute, so a long PDF can't fill the
 * whole answer. Ties fall back to a fixed order, so a query always returns
 * the same passages.
 */
export async function rankChunks(
  userId: string,
  queryEmbedding: number[],
  { subjectIds = [], limit, perSource }: { subjectIds?: string[]; limit: number; perSource: number },
): Promise<RankedChunk[]> {
  // A vector of any other size was made by another model: nothing to compare.
  if (queryEmbedding.length !== EMBEDDING_DIMS) return [];

  const inSubjects = subjectIds.length > 0 ? Prisma.sql`AND c."subjectId" = ANY(${subjectIds}::text[])` : Prisma.empty;
  const rows = await prisma.$queryRaw<
    (Omit<RankedChunk, "ref" | "source"> & { source: ChunkSourceType })[]
  >`
    WITH scored AS (
      SELECT c."id", c."source", c."sourceId", c."ordinal",
             (SELECT sum(a * b) FROM unnest(c."embedding", ${queryEmbedding}::float8[]) AS pair(a, b)) AS score
      FROM "NoteChunk" c
      WHERE c."userId" = ${userId}
        AND c."embeddingModel" = ${EMBEDDING_MODEL}
        AND c."dims" = ${EMBEDDING_DIMS}
        ${inSubjects}
        AND (c."source" <> 'MILESTONE' OR ${Prisma.raw(notReplacedSql('c."sourceId"'))})
    ),
    ranked AS (
      SELECT *, row_number() OVER (PARTITION BY "source", "sourceId" ORDER BY score DESC, "ordinal") AS nth
      FROM scored
    ),
    best AS (
      SELECT "id", score FROM ranked
      WHERE nth <= ${perSource}
      ORDER BY score DESC, "source", "sourceId", "ordinal"
      LIMIT ${limit}
    )
    SELECT c."subjectId", s."title" AS "subjectTitle", s."color" AS "subjectColor",
           c."source"::text AS "source", c."sourceId", c."ordinal", c."breadcrumb", c."content", best.score
    FROM best
    JOIN "NoteChunk" c ON c."id" = best."id"
    JOIN "Subject" s ON s."id" = c."subjectId"
    ORDER BY best.score DESC, c."source", c."sourceId", c."ordinal"`;

  const refs = await pageRefs(userId, rows);
  return rows.map((r) => ({ ...r, ref: refs.get(sourceKey(r.source, r.sourceId)) ?? null }));
}
