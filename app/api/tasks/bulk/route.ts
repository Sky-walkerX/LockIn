import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const BulkSchema = z.object({
  subjectId: z.string().min(1),
  milestoneId: z.string().nullable().optional(),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        dueDate: z.string().datetime().optional(),
        estimatedTime: z.number().int().positive().optional(),
      }),
    )
    .min(1),
});

// POST /api/tasks/bulk - create several tasks at once under one subject/milestone
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { subjectId, milestoneId, tasks } = parsed.data;

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  if (milestoneId) {
    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId, subjectId } });
    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const result = await prisma.task.createMany({
    data: tasks.map((t) => ({
      title: t.title,
      priority: t.priority,
      estimatedTime: t.estimatedTime,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      subjectId,
      milestoneId: milestoneId ?? null,
      userId,
    })),
  });
  return NextResponse.json({ count: result.count }, { status: 201 });
}
