import prisma from "@/lib/prisma";
import { excerpt } from "@/lib/notes/excerpt";

export type RecentNote = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  taskCount: number;
  source: string | null;
  witnessedAt: string | null;
  subject: { id: string; title: string; color: string | null; isInbox: boolean };
};

type Row = {
  id: string;
  title: string;
  head: string;
  updatedAt: Date;
  taskCount: number;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string | null;
  subjectIsInbox: boolean;
  source: string | null;
  witnessedAt: Date | null;
};

// One statement for the whole list. Only the head of each note comes
// back (enough for an excerpt once code blocks are dropped), never the whole
// body, since a note can be pages long.
const RECENT_SQL = `
  SELECT m.id, m.title, left(m.notes, 1500) AS head, m."updatedAt", m.source, m."witnessedAt",
         (SELECT count(*)::int FROM "Task" t WHERE t."milestoneId" = m.id) AS "taskCount",
         s.id AS "subjectId", s.title AS "subjectTitle", s.color AS "subjectColor", s."isInbox" AS "subjectIsInbox"
  FROM "Milestone" m
  JOIN "Subject" s ON s.id = m."subjectId"
  WHERE s."userId" = $1 AND s."isArchived" = false
  ORDER BY m."updatedAt" DESC
  LIMIT $2`;

// The user's most recently edited notes across subjects, newest first.
export async function listRecentNotes(userId: string, limit: number): Promise<RecentNote[]> {
  const rows = await prisma.$queryRawUnsafe<Row[]>(RECENT_SQL, userId, limit);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: excerpt(r.head),
    updatedAt: r.updatedAt.toISOString(),
    taskCount: r.taskCount,
    source: r.source,
    witnessedAt: r.witnessedAt ? r.witnessedAt.toISOString() : null,
    subject: { id: r.subjectId, title: r.subjectTitle, color: r.subjectColor, isInbox: r.subjectIsInbox },
  }));
}
