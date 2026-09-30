import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { getOrCreateInbox } from "@/lib/subjects/inbox";

export type InboxSummary = {
  id: string;
  /** Notes sitting in the Inbox. */
  count: number;
  /** Agents' notes anywhere in the notebook that the user hasn't witnessed. */
  awaiting: number;
};

// GET /api/inbox - the user's Inbox (created on first call) and its counts
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = await getOrCreateInbox(userId);
  const [row] = await prisma.$queryRaw<{ count: number; awaiting: number }[]>`
    SELECT count(*) FILTER (WHERE m."subjectId" = ${id})::int AS count,
           count(*) FILTER (WHERE m.source IS NOT NULL AND m.source <> 'web' AND m."witnessedAt" IS NULL)::int AS awaiting
    FROM "Milestone" m
    JOIN "Subject" s ON s.id = m."subjectId"
    WHERE s."userId" = ${userId}`;
  return NextResponse.json({ id, count: row?.count ?? 0, awaiting: row?.awaiting ?? 0 } satisfies InboxSummary);
}
