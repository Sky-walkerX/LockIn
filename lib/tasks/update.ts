import { addDays, addWeeks, addMonths } from "date-fns";
import prisma from "@/lib/prisma";
import type { Prisma, Recurrence, Subtask, Task } from "@/app/generated/prisma/client";
import { setClause } from "@/lib/sql";
import { appendNote, continueNote } from "@/lib/notes/append";

export type TaskPatch = {
  title?: string;
  description?: string | null;
  isCompleted?: boolean;
  dueDate?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  estimatedTime?: number | null;
  milestoneId?: string | null;
  timeSpent?: number | null;
  recurrence?: Recurrence | null;
};

// Task's two enum columns. The raw UPDATE below binds their values as `text`,
// which Postgres will not implicitly coerce to an enum — without the cast, any
// save carrying a priority or recurrence fails with error 42804. The edit form
// sends `priority` on every save, so this covers plain renames too.
const ENUM_CASTS = { priority: "Priority", recurrence: "Recurrence" };

// Next due date for a recurring task: advance from `base` by one interval, then
// keep rolling forward until it lands in the future — so finishing a task never
// spawns one that's already overdue.
function nextDueDate(base: Date, recurrence: Recurrence): Date {
  const step = (d: Date) =>
    recurrence === "DAILY" ? addDays(d, 1) : recurrence === "WEEKLY" ? addWeeks(d, 1) : addMonths(d, 1);
  const now = new Date();
  let next = step(base);
  while (next <= now) next = step(next);
  return next;
}

/**
 * Apply a validated patch to one of the user's tasks. Null when the task isn't
 * theirs, "empty" when the patch changes nothing. Shared by PUT /api/tasks/[id]
 * and the MCP server.
 */
export async function updateTask(userId: string, id: string, patch: TaskPatch): Promise<Task | null | "empty"> {
  const { dueDate, isCompleted, ...rest } = patch;
  // Unchecked variant: we set the milestoneId foreign key as a scalar directly.
  const data: Prisma.TaskUncheckedUpdateInput = { ...rest };

  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (isCompleted !== undefined) {
    data.isCompleted = isCompleted;
    data.completedAt = isCompleted ? new Date() : null;
  }

  // Only completing a task can spawn a recurrence, and that's the one branch
  // needing the pre-update row. Every other edit (notes, title, priority, …)
  // skips this read and updates in a single round trip below.
  if (isCompleted !== true) {
    const set = setClause(data as Record<string, unknown>, ENUM_CASTS);
    if (!set) return "empty";

    // One round trip: ownership rides along in the WHERE, RETURNING hands back
    // the new row.
    const n = set.values.length;
    const [task] = await prisma.$queryRawUnsafe<Task[]>(
      `UPDATE "Task" SET ${set.clause} WHERE "id" = $${n + 1} AND "userId" = $${n + 2} RETURNING *`,
      ...set.values,
      id,
      userId,
    );
    return task ?? null;
  }

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return null;

  // Recurring tasks: when one flips incomplete -> complete, spawn the next
  // instance (no background job — regeneration happens right here).
  const justCompleted = !existing.isCompleted;
  const recurrence = rest.recurrence !== undefined ? rest.recurrence : existing.recurrence;
  const effectiveDue = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate;

  if (justCompleted && recurrence) {
    const [task] = await prisma.$transaction([
      prisma.task.update({ where: { id }, data }),
      prisma.task.create({
        data: {
          title: rest.title ?? existing.title,
          description: rest.description !== undefined ? rest.description : existing.description,
          priority: rest.priority ?? existing.priority,
          estimatedTime: rest.estimatedTime !== undefined ? rest.estimatedTime : existing.estimatedTime,
          milestoneId: rest.milestoneId !== undefined ? rest.milestoneId : existing.milestoneId,
          recurrence,
          subjectId: existing.subjectId,
          userId,
          // Keep the completed task's list position (order defaults to 0 and
          // would jump the new occurrence to the top).
          order: existing.order,
          dueDate: nextDueDate(effectiveDue ?? new Date(), recurrence),
        },
      }),
    ]);
    return task;
  }

  return prisma.task.update({ where: { id }, data });
}

export type SubtaskPatch = { title?: string; notes?: string; isCompleted?: boolean; order?: number };

/**
 * Apply a validated patch to one of the user's subtasks. Null when it isn't
 * theirs, "empty" when the patch changes nothing. Scoped through
 * task -> subject -> user (subtasks carry no userId).
 */
export async function updateSubtask(userId: string, id: string, patch: SubtaskPatch): Promise<Subtask | null | "empty"> {
  const { isCompleted, ...rest } = patch;
  const data: { title?: string; notes?: string; order?: number; isCompleted?: boolean; completedAt?: Date | null } = {
    ...rest,
  };
  if (isCompleted !== undefined) {
    data.isCompleted = isCompleted;
    data.completedAt = isCompleted ? new Date() : null;
  }

  const set = setClause(data);
  if (!set) return "empty";

  // One round trip: ownership rides along in the WHERE (a row that isn't the
  // caller's simply doesn't match), and RETURNING hands back the new row.
  const n = set.values.length;
  const [subtask] = await prisma.$queryRawUnsafe<Subtask[]>(
    `UPDATE "Subtask" s SET ${set.clause}
     FROM "Task" t, "Subject" sub
     WHERE s."id" = $${n + 1}
       AND t."id" = s."taskId"
       AND sub."id" = t."subjectId"
       AND sub."userId" = $${n + 2}
     RETURNING s.*`,
    ...set.values,
    id,
    userId,
  );
  return subtask ?? null;
}

/** A dated, labelled block ("from focus · 2026-10-02"); without one the text simply continues the notes. */
export type AppendBlock = { label: string; day: string };

const added = (existing: string, text: string, block?: AppendBlock) =>
  block ? appendNote(existing, text, block.label, block.day) : continueNote(existing, text);

/**
 * Adds to the end of a task's notes with its row held from the read to the
 * write, so two additions at once both land (as lib/notes/write.ts does for
 * notes). Null when the task isn't the user's.
 */
export async function appendToTask(userId: string, id: string, text: string, block?: AppendBlock): Promise<Task | null> {
  return prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<{ description: string | null }[]>`
      SELECT "description" FROM "Task" WHERE "id" = ${id} AND "userId" = ${userId} FOR UPDATE`;
    if (!row) return null;
    return tx.task.update({ where: { id }, data: { description: added(row.description ?? "", text, block) } });
  });
}

/** The same for a subtask, scoped through its task. */
export async function appendToSubtask(userId: string, id: string, text: string, block?: AppendBlock): Promise<Subtask | null> {
  return prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<{ notes: string }[]>`
      SELECT s."notes" FROM "Subtask" s
      JOIN "Task" t ON t."id" = s."taskId"
      WHERE s."id" = ${id} AND t."userId" = ${userId}
      FOR UPDATE OF s`;
    if (!row) return null;
    return tx.subtask.update({ where: { id }, data: { notes: added(row.notes, text, block) } });
  });
}
