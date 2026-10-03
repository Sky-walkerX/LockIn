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

export type Found =
  | { kind: "note"; subjectId: string; note: NoteForAgent }
  | { kind: "task" | "subtask"; subjectId: string; item: PlanItemForAgent };

const where = (subject: { title: string; isInbox: boolean }) => (subject.isInbox ? "Inbox" : subject.title);

/** A note, task or subtask by id, whichever it is. */
export async function readById(userId: string, id: string): Promise<Found | null> {
  const [note, task, subtask] = await Promise.all([
    prisma.milestone.findFirst({
      where: { id, subject: { userId } },
      include: { subject: PLACE, tasks: TASKS },
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
