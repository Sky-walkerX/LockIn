import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { NoteForAgent, PlanForAgent, PlanItemForAgent } from "@/lib/mcp/format";

// What get_note and get_plan read, shaped for the formatter. Every query is
// scoped to the token's user.

const SUBTASKS = {
  select: { id: true, title: true, isCompleted: true, notes: true, parentId: true },
  orderBy: { order: "asc" },
} satisfies Prisma.Task$subtasksArgs;

const TASK = {
  id: true,
  title: true,
  isCompleted: true,
  description: true,
  subtasks: SUBTASKS,
} satisfies Prisma.TaskSelect;

const TASKS = { select: TASK, orderBy: { order: "asc" } } satisfies Prisma.Milestone$tasksArgs;

const PLACE = { select: { id: true, title: true, isInbox: true } } as const;

/** The notes that say they replace one, newest first (lib/notes/status.ts). */
export const REPLACEMENTS = {
  select: { id: true, page: true, title: true, source: true, witnessedAt: true, anchorCommit: true, anchorCommitAt: true },
  orderBy: { createdAt: "desc" },
} satisfies Prisma.Milestone$supersededByArgs;

/**
 * For search hits that are notes: their page, anchor commit, and whether
 * they're flagged or have a replacement waiting. Replaced notes are already
 * gone from the hits (the searches leave them out).
 */
export async function noteMarks(userId: string, ids: string[]) {
  type Marks = { page: number | null; anchorCommit: string | null; anchorCommitAt: Date | null; stale: boolean; proposed: boolean };
  if (ids.length === 0) return new Map<string, Marks>();
  const rows = await prisma.milestone.findMany({
    where: { id: { in: ids }, subject: { userId } },
    select: {
      id: true,
      page: true,
      anchorCommit: true,
      anchorCommitAt: true,
      staleReason: true,
      _count: { select: { supersededBy: true } },
    },
  });
  return new Map<string, Marks>(
    rows.map((r) => [
      r.id,
      {
        page: r.page,
        anchorCommit: r.anchorCommit,
        anchorCommitAt: r.anchorCommitAt,
        stale: r.staleReason != null,
        proposed: r._count.supersededBy > 0,
      },
    ]),
  );
}

export type Found =
  | { kind: "note"; subjectId: string; note: NoteForAgent }
  | { kind: "task" | "subtask"; subjectId: string; item: PlanItemForAgent };

const where = (subject: { title: string; isInbox: boolean }) => (subject.isInbox ? "Inbox" : subject.title);

/** A note, task or subtask by id, whichever it is. */
export async function readById(userId: string, id: string): Promise<Found | null> {
  const [note, task, subtask] = await Promise.all([
    prisma.milestone.findFirst({
      where: { id, subject: { userId } },
      include: {
        subject: PLACE,
        chapter: { select: { title: true } },
        tasks: TASKS,
        supersedes: { select: { id: true, page: true, title: true, anchorCommit: true, anchorCommitAt: true } },
        supersededBy: REPLACEMENTS,
      },
    }),
    prisma.task.findFirst({
      where: { id, userId },
      select: { ...TASK, subject: PLACE, milestone: { select: { title: true } } },
    }),
    prisma.subtask.findFirst({
      where: { id, task: { userId } },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        notes: true,
        parent: { select: { title: true } },
        task: { select: { title: true, subtasks: SUBTASKS, subject: PLACE, milestone: { select: { title: true } } } },
      },
    }),
  ]);

  if (note) return { kind: "note", subjectId: note.subject.id, note };
  if (task) {
    const path = [where(task.subject), task.milestone?.title].filter((p): p is string => Boolean(p));
    return {
      kind: "task",
      subjectId: task.subject.id,
      item: { kind: "task", id: task.id, title: task.title, isCompleted: task.isCompleted, notes: task.description ?? "", path, subtasks: task.subtasks },
    };
  }
  if (subtask) {
    const t = subtask.task;
    const path = [where(t.subject), t.milestone?.title, t.title, subtask.parent?.title].filter((p): p is string => Boolean(p));
    return {
      kind: "subtask",
      subjectId: t.subject.id,
      item: { kind: "subtask", id: subtask.id, title: subtask.title, isCompleted: subtask.isCompleted, notes: subtask.notes, path, subtasks: t.subtasks },
    };
  }
  return null;
}

/** A subject's whole plan: its notes in order with their tasks, then the tasks under no note. */
export async function readPlan(userId: string, subjectId: string): Promise<PlanForAgent | null> {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId },
    select: {
      title: true,
      isInbox: true,
      milestones: { select: { id: true, title: true, page: true, tasks: TASKS }, orderBy: { order: "asc" } },
      tasks: { where: { milestoneId: null }, ...TASKS },
    },
  });
  if (!subject) return null;
  return { subject: { title: subject.title, isInbox: subject.isInbox }, notes: subject.milestones, loose: subject.tasks };
}
