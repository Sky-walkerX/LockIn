import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const TaskSchema = z.object({
  subjectId: z.string().min(1),
  milestoneId: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedTime: z.number().int().positive().optional(),
});

// GET /api/tasks
//   ?subjectId=  / ?milestoneId=  -> filter within a subject/milestone
//   ?today=true                   -> incomplete tasks due today or overdue, across all
//                                    subjects (for the cross-subject "Today" view)
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const subjectId = sp.get("subjectId");
  const milestoneId = sp.get("milestoneId");

  if (sp.get("today") === "true") {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: { userId, isCompleted: false, dueDate: { not: null, lte: endOfToday } },
      orderBy: { dueDate: "asc" },
      include: { subject: { select: { id: true, title: true, color: true } } },
    });
    return NextResponse.json(tasks);
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      ...(subjectId ? { subjectId } : {}),
      ...(milestoneId ? { milestoneId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks);
}

// POST /api/tasks - create a task under a subject (milestone optional)
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = TaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { subjectId, milestoneId, dueDate, ...rest } = parsed.data;

  // Ownership: subject must be the user's; if a milestone is given it must
  // belong to that subject.
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  if (milestoneId) {
    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId, subjectId } });
    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      ...rest,
      subjectId,
      milestoneId: milestoneId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
