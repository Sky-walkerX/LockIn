import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const SubtaskSchema = z.object({
  taskId: z.string().min(1),
  parentId: z.string().min(1).optional(),
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
  const { taskId, parentId, title, notes } = parsed.data;

  // Ownership check and order aggregate run in parallel to keep create latency
  // low (a failed check just wastes one aggregate). Order is per sibling group
  // (a task's top-level list, or one parent's children).
  const [task, last, parent] = await Promise.all([
    prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } }),
    prisma.subtask.aggregate({
      where: { taskId, parentId: parentId ?? null },
      _max: { order: true },
    }),
    parentId
      ? prisma.subtask.findFirst({ where: { id: parentId, taskId }, select: { parentId: true } })
      : Promise.resolve(null),
  ]);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  // The parent lookup is scoped to the (user-owned) task, so a hit also proves
  // the parent belongs to this user.
  if (parentId && !parent) {
    return NextResponse.json({ error: "Parent subtask not found" }, { status: 404 });
  }
  if (parent?.parentId) {
    return NextResponse.json({ error: "Nesting is limited to one level" }, { status: 400 });
  }

  const subtask = await prisma.subtask.create({
    data: {
      taskId,
      parentId: parentId ?? null,
      title,
      notes: notes ?? "",
      order: (last._max.order ?? -1) + 1,
    },
  });
  return NextResponse.json(subtask, { status: 201 });
}
