import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";
import { getOrCreateInbox } from "@/lib/subjects/inbox";
import { insertNote, nextOrder } from "@/lib/notes/write";

const MilestoneSchema = z.object({
  // Left out, the note is filed in the user's Inbox.
  subjectId: z.string().min(1).optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
  order: z.number().int().optional(),
  // Who's writing: "web" from the app, or an agent's id.
  source: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/).optional(),
});

// GET /api/milestones?subjectId=... - milestones for a subject (or all the user's)
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjectId = request.nextUrl.searchParams.get("subjectId");
  const milestones = await prisma.milestone.findMany({
    where: { subject: { userId }, ...(subjectId ? { subjectId } : {}) },
    orderBy: { order: "asc" },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(milestones);
}

// POST /api/milestones - create a note (order defaults to end of list; no subject means the Inbox)
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = MilestoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { title, notes, order, source } = parsed.data;
  const subjectId = parsed.data.subjectId ?? (await getOrCreateInbox(userId));

  // Ownership check and order lookup run in parallel to keep create latency
  // low (a failed check just wastes one lookup).
  const [subject, resolvedOrder] = await Promise.all([
    prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } }),
    order ?? nextOrder(subjectId),
  ]);
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  const milestone = await insertNote(subjectId, { title, notes, order: resolvedOrder, source });
  return NextResponse.json(milestone, { status: 201 });
}
