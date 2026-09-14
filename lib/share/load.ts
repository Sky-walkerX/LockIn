import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import type { ShareType } from "@/app/generated/prisma";
import type { SharedNode, SharedPayload, SharedResource } from "./tree";

/** 16 random bytes, base64url — 22 unpadded chars, safe in a path segment. */
export function mintToken(): string {
  return randomBytes(16).toString("base64url");
}

/**
 * Does `userId` own the record `type`/`entityId`? Milestones and subtasks carry
 * no userId of their own, so they are scoped through their subject exactly as
 * their own API routes scope them.
 */
export async function ownsEntity(
  type: ShareType,
  entityId: string,
  userId: string,
): Promise<boolean> {
  switch (type) {
    case "SUBJECT":
      return (await prisma.subject.count({ where: { id: entityId, userId } })) > 0;
    case "MILESTONE":
      return (await prisma.milestone.count({ where: { id: entityId, subject: { userId } } })) > 0;
    case "TASK":
      return (await prisma.task.count({ where: { id: entityId, userId } })) > 0;
    case "SUBTASK":
      return (
        (await prisma.subtask.count({ where: { id: entityId, task: { subject: { userId } } } })) > 0
      );
  }
}

// Subtasks nest one level in the UI, but the shape is recursive; include two
// levels so a shared task shows its subtasks and their items.
const subtaskInclude = {
  where: { parentId: null },
  orderBy: { order: "asc" as const },
  include: { children: { orderBy: { order: "asc" as const } } },
} as const;

const taskInclude = {
  orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }],
  include: { subtasks: subtaskInclude },
};

type RawSubtask = {
  id: string;
  title: string;
  notes: string;
  isCompleted: boolean;
  children?: RawSubtask[];
};

type RawTask = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: SharedNode["priority"];
  dueDate: Date | null;
  recurrence: SharedNode["recurrence"];
  subtasks?: RawSubtask[];
};

const subtaskNode = (s: RawSubtask): SharedNode => ({
  id: s.id,
  kind: "subtask",
  title: s.title,
  notes: s.notes || null,
  isCompleted: s.isCompleted,
  priority: null,
  dueDate: null,
  recurrence: null,
  children: (s.children ?? []).map(subtaskNode),
});

const taskNode = (t: RawTask): SharedNode => ({
  id: t.id,
  kind: "task",
  title: t.title,
  notes: t.description || null,
  isCompleted: t.isCompleted,
  priority: t.priority,
  dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  recurrence: t.recurrence,
  children: (t.subtasks ?? []).map(subtaskNode),
});

const resourceNode = (r: {
  id: string;
  type: SharedResource["type"];
  title: string;
  url: string;
  note: string | null;
}): SharedResource => ({ id: r.id, type: r.type, title: r.title, url: r.url, note: r.note });

/**
 * Resolve a share token into its public payload, or null when the token is
 * unknown or the record behind it has since been deleted.
 *
 * Every read here is driven by the token alone — no session, no userId. The
 * mappers above are the allowlist: only the fields they copy ever reach a
 * viewer, so a resource's `extracted` document text and every `userId` stay
 * server-side by construction rather than by remembering to delete them.
 */
export async function loadShare(token: string): Promise<SharedPayload | null> {
  const share = await prisma.share.findUnique({ where: { token } });
  if (!share) return null;

  const base = { type: share.type, sharedAt: share.createdAt.toISOString() };

  if (share.type === "SUBJECT") {
    const subject = await prisma.subject.findUnique({
      where: { id: share.entityId },
      include: {
        milestones: { orderBy: { order: "asc" }, include: { tasks: taskInclude } },
        tasks: { where: { milestoneId: null }, ...taskInclude },
        resources: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!subject) return null;

    return {
      ...base,
      breadcrumb: [],
      color: subject.color,
      resources: subject.resources.map(resourceNode),
      root: {
        id: subject.id,
        kind: "subject",
        title: subject.title,
        notes: subject.description || null,
        isCompleted: null,
        priority: null,
        dueDate: null,
        recurrence: null,
        children: [
          ...subject.milestones.map((m) => ({
            id: m.id,
            kind: "milestone" as const,
            title: m.title,
            notes: m.notes || null,
            isCompleted: m.isCompleted,
            priority: null,
            dueDate: null,
            recurrence: null,
            children: m.tasks.map(taskNode),
          })),
          ...subject.tasks.map(taskNode),
        ],
      },
    };
  }

  if (share.type === "MILESTONE") {
    const milestone = await prisma.milestone.findUnique({
      where: { id: share.entityId },
      include: { subject: true, tasks: taskInclude },
    });
    if (!milestone) return null;

    return {
      ...base,
      breadcrumb: [milestone.subject.title],
      color: milestone.subject.color,
      resources: [],
      root: {
        id: milestone.id,
        kind: "milestone",
        title: milestone.title,
        notes: milestone.notes || null,
        isCompleted: milestone.isCompleted,
        priority: null,
        dueDate: null,
        recurrence: null,
        children: milestone.tasks.map(taskNode),
      },
    };
  }

  if (share.type === "TASK") {
    const task = await prisma.task.findUnique({
      where: { id: share.entityId },
      include: { subject: true, milestone: true, subtasks: subtaskInclude },
    });
    if (!task) return null;

    return {
      ...base,
      breadcrumb: [task.subject.title, ...(task.milestone ? [task.milestone.title] : [])],
      color: task.subject.color,
      resources: [],
      root: taskNode(task),
    };
  }

  // SUBTASK — covers both a top-level subtask and a nested item. `children` is
  // empty for an item, which is exactly right: it has none.
  const subtask = await prisma.subtask.findUnique({
    where: { id: share.entityId },
    include: {
      children: { orderBy: { order: "asc" } },
      task: { include: { subject: true, milestone: true } },
    },
  });
  if (!subtask) return null;

  const { task } = subtask;
  return {
    ...base,
    breadcrumb: [
      task.subject.title,
      ...(task.milestone ? [task.milestone.title] : []),
      task.title,
    ],
    color: task.subject.color,
    resources: [],
    root: subtaskNode(subtask),
  };
}
