import prisma from "@/lib/prisma";
import { embedOnServer } from "@/lib/rag/ingest";
import { rankChunks } from "@/lib/rag/sources";
import { notReplacedSql } from "./status";

// The notes a new one may contradict or repeat, shown to the agent that just
// saved it. Whether two notes disagree takes a model, and the notebook runs
// none; the agent saving the note is one, so the notebook finds the likely
// pages and the agent decides. When its note replaces one, it says so with
// link_replacement, and the old page retires once the user witnesses the new.

export const RELATED_LIMIT = 3;

/** How alike by meaning two notes must be to count, on the embedder's cosine scale. */
const SIMILAR = 0.5;

export type Related = {
  id: string;
  page: number | null;
  title: string;
  source: string | null;
  subjectTitle: string;
  isInbox: boolean;
  anchorCommit: string | null;
  anchorCommitAt: Date | null;
};

/** The distinct words of a title worth matching on: letters and digits, three or more long. Pure. */
export function titleTerms(title: string): string[] {
  const words = title.toLowerCase().match(/[\p{L}\p{N}_]{3,}/gu) ?? [];
  return [...new Set(words)].slice(0, 8);
}

/**
 * Whether a candidate shares enough of the new title's words to be about the
 * same thing: at least two, and at least half of them. A title of one word
 * needs that word. Pure.
 */
export function sharesEnough(terms: string[], text: string): boolean {
  if (terms.length === 0) return false;
  const hay = text.toLowerCase();
  const hits = terms.filter((t) => hay.includes(t)).length;
  return terms.length === 1 ? hits === 1 : hits >= 2 && hits * 2 >= terms.length;
}

const RELATED_SELECT = {
  id: true,
  page: true,
  title: true,
  source: true,
  anchorCommit: true,
  anchorCommitAt: true,
  subject: { select: { title: true, isInbox: true } },
} as const;

/** By meaning, when the ingest service can embed: the closest notes over the floor, best first. */
async function byMeaning(userId: string, noteId: string, text: string): Promise<string[] | null> {
  const embedded = await embedOnServer([text], "query");
  if (!embedded.ok) return null;
  const ranked = await rankChunks(userId, embedded.vectors[0], { limit: 12, perSource: 1 });
  return ranked
    .filter((c) => c.source === "MILESTONE" && c.sourceId !== noteId && c.score >= SIMILAR)
    .map((c) => c.sourceId);
}

/** By the title's words, in titles and bodies: full-text candidates, kept when they share enough words. */
async function byWords(userId: string, noteId: string, title: string): Promise<string[]> {
  const terms = titleTerms(title);
  if (terms.length === 0) return [];
  const rows = await prisma.$queryRawUnsafe<{ id: string; title: string; notes: string }[]>(
    `SELECT m.id, m.title, left(m.notes, 4000) AS notes
     FROM "Milestone" m
     JOIN "Subject" s ON s.id = m."subjectId"
     WHERE s."userId" = $1 AND m.id <> $2 AND NOT s."isArchived"
       AND to_tsvector('english', m.title || ' ' || m.notes) @@ websearch_to_tsquery('english', $3)
       AND ${notReplacedSql("m.id")}
     ORDER BY ts_rank(to_tsvector('english', m.title || ' ' || m.notes), websearch_to_tsquery('english', $3)) DESC
     LIMIT 20`,
    userId,
    noteId,
    terms.join(" or "),
  );
  return rows.filter((r) => sharesEnough(terms, `${r.title} ${r.notes}`)).map((r) => r.id);
}

/**
 * Up to RELATED_LIMIT of the user's notes that look like the same subject
 * matter as a note just saved, leaving out the note itself, the one it
 * already replaces, and pages already retired. Best first.
 */
export async function relatedNotes(
  userId: string,
  note: { id: string; title: string; notes: string; supersedesId?: string | null },
): Promise<Related[]> {
  const ids =
    (await byMeaning(userId, note.id, `${note.title}\n\n${note.notes.slice(0, 2000)}`)) ??
    (await byWords(userId, note.id, note.title));
  const wanted = ids.filter((id) => id !== note.supersedesId).slice(0, RELATED_LIMIT);
  if (wanted.length === 0) return [];
  const rows = await prisma.milestone.findMany({
    where: { id: { in: wanted }, subject: { userId, isArchived: false } },
    select: RELATED_SELECT,
  });
  return wanted.flatMap((id) => {
    const r = rows.find((x) => x.id === id);
    return r ? [{ ...r, subjectTitle: r.subject.title, isInbox: r.subject.isInbox }] : [];
  });
}
