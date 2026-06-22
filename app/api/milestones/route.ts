import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const MilestoneSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().min(1),
  notes: z.string().optional(),
  order: z.number().int().optional(),
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

// POST /api/milestones - create a milestone (order defaults to end of list)
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = MilestoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { subjectId, title, notes, order } = parsed.data;

  // Ownership: the subject must belong to the user.
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  let resolvedOrder = order;
  if (resolvedOrder === undefined) {
    const last = await prisma.milestone.findFirst({
      where: { subjectId },
      orderBy: { order: "desc" },
    });
    resolvedOrder = last ? last.order + 1 : 0;
  }

  const milestone = await prisma.milestone.create({
    data: { subjectId, title, notes: notes ?? "", order: resolvedOrder },
  });
  return NextResponse.json(milestone, { status: 201 });
}
