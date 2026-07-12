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
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).nullable().optional(),
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
    // The client passes its local end-of-day as ?before= so "today" follows
    // the user's timezone, not the server's; fall back to server-local.
    const beforeParam = sp.get("before");
    const clientBefore = beforeParam ? new Date(beforeParam) : null;
    let endOfToday: Date;
    if (clientBefore && !isNaN(clientBefore.getTime())) {
      endOfToday = clientBefore;
    } else {
      endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
    }

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
  // belong to that subject. One relation-scoped lookup covers both, run in
  // parallel with the order aggregate to keep create latency low.
  const ownership = milestoneId
    ? prisma.milestone.findFirst({
        where: { id: milestoneId, subjectId, subject: { userId } },
        select: { id: true },
      })
    : prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } });

  // Append to the bottom of its list (the milestone's tasks, or the loose list).
  const [owned, last] = await Promise.all([
    ownership,
    prisma.task.aggregate({
      where: { userId, subjectId, milestoneId: milestoneId ?? null },
      _max: { order: true },
    }),
  ]);
  if (!owned) {
    return NextResponse.json(
      { error: milestoneId ? "Milestone not found" : "Subject not found" },
      { status: 404 },
    );
  }

  const task = await prisma.task.create({
    data: {
      ...rest,
      subjectId,
      milestoneId: milestoneId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (last._max.order ?? -1) + 1,
      userId,
    },
  });
  return NextResponse.json(task, { status: 201 });
}
