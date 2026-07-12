import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const SubtaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  notes: z.string().optional(),
});

// POST /api/subtasks - create a subtask under a task the user owns.
// Subtasks have no userId; ownership is via task -> subject -> user.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = SubtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { taskId, title, notes } = parsed.data;

  // Ownership check and order aggregate run in parallel to keep create latency
  // low (a failed check just wastes one aggregate).
  const [task, last] = await Promise.all([
    prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } }),
    prisma.subtask.aggregate({ where: { taskId }, _max: { order: true } }),
  ]);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const subtask = await prisma.subtask.create({
    data: { taskId, title, notes: notes ?? "", order: (last._max.order ?? -1) + 1 },
  });
  return NextResponse.json(subtask, { status: 201 });
}
