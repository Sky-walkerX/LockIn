import prisma from "@/lib/prisma";
import type { Subtask, Task } from "@/app/generated/prisma/client";

// Creating plan items, shared by the tasks and subtasks routes and the MCP
// server. Each checks ownership in the same round trip as its order lookup.

export type NewTask = {
  subjectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  estimatedTime?: number;
  recurrence?: "DAILY" | "WEEKLY" | "MONTHLY" | null;
};

/** A task at the bottom of its list (its note's tasks, or the subject's loose ones). */
export async function createTask(userId: string, input: NewTask): Promise<Task | "subject-missing" | "note-missing"> {
  const { subjectId, milestoneId, dueDate, ...rest } = input;
  // Ownership: subject must be the user's; if a milestone is given it must
  // belong to that subject. One relation-scoped lookup covers both, run in
  // parallel with the order aggregate to keep create latency low.
  const ownership = milestoneId
    ? prisma.milestone.findFirst({
        where: { id: milestoneId, subjectId, subject: { userId } },
        select: { id: true },
      })
    : prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } });
  const [owned, last] = await Promise.all([
    ownership,
    prisma.task.aggregate({
      where: { userId, subjectId, milestoneId: milestoneId ?? null },
      _max: { order: true },
    }),
  ]);
  if (!owned) return milestoneId ? "note-missing" : "subject-missing";
  return prisma.task.create({
    data: {
      ...rest,
      subjectId,
      milestoneId: milestoneId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (last._max.order ?? -1) + 1,
      userId,
    },
  });
}

export type NewSubtask = { taskId: string; parentId?: string; title: string; notes?: string };

/** A subtask at the bottom of its sibling group. Nesting stops at one level. */
export async function createSubtask(
  userId: string,
  input: NewSubtask,
): Promise<Subtask | "task-missing" | "parent-missing" | "too-deep"> {
  const { taskId, parentId, title, notes } = input;
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
  if (!task) return "task-missing";
  // The parent lookup is scoped to the (user-owned) task, so a hit also proves
  // the parent belongs to this user.
  if (parentId && !parent) return "parent-missing";
  if (parent?.parentId) return "too-deep";

  return prisma.subtask.create({
    data: {
      taskId,
      parentId: parentId ?? null,
      title,
      notes: notes ?? "",
      order: (last._max.order ?? -1) + 1,
    },
  });
}
