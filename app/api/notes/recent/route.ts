import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { excerpt } from "@/lib/notes/excerpt";

export type RecentNote = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  taskCount: number;
  subject: { id: string; title: string; color: string | null };
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
};

// One statement for the whole list. Only the head of each note comes
// back (enough for an excerpt once code blocks are dropped), never the whole
// body, since a note can be pages long.
const RECENT_SQL = `
  SELECT m.id, m.title, left(m.notes, 1500) AS head, m."updatedAt",
         (SELECT count(*)::int FROM "Task" t WHERE t."milestoneId" = m.id) AS "taskCount",
         s.id AS "subjectId", s.title AS "subjectTitle", s.color AS "subjectColor"
  FROM "Milestone" m
  JOIN "Subject" s ON s.id = m."subjectId"
  WHERE s."userId" = $1 AND s."isArchived" = false
  ORDER BY m."updatedAt" DESC
  LIMIT $2`;

// GET /api/notes/recent?limit=12 - the user's most recently changed notes, across subjects
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 12);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 50) : 12;

  const rows = await prisma.$queryRawUnsafe<Row[]>(RECENT_SQL, userId, limit);
  const notes: RecentNote[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: excerpt(r.head),
    updatedAt: r.updatedAt.toISOString(),
    taskCount: r.taskCount,
    subject: { id: r.subjectId, title: r.subjectTitle, color: r.subjectColor },
  }));
  return NextResponse.json(notes);
}
