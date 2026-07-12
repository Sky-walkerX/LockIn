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

  // Ownership: one relation-scoped lookup covers subject + milestone, run in
  // parallel with the order aggregate to keep latency low.
  const ownership = milestoneId
    ? prisma.milestone.findFirst({
        where: { id: milestoneId, subjectId, subject: { userId } },
        select: { id: true },
      })
    : prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } });

  // Append the batch to the bottom of its list, preserving the given order.
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
  const base = (last._max.order ?? -1) + 1;

  const result = await prisma.task.createMany({
    data: tasks.map((t, i) => ({
      title: t.title,
      priority: t.priority,
      estimatedTime: t.estimatedTime,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
      order: base + i,
      subjectId,
      milestoneId: milestoneId ?? null,
      userId,
    })),
  });
  return NextResponse.json({ count: result.count }, { status: 201 });
}
