import type { Priority, Recurrence, ResourceType, ShareType } from "@/app/generated/prisma";

/**
 * The shape a public share page renders.
 *
 * Every shareable record — subject, milestone, task, subtask, item — collapses
 * into the same recursive node, so one renderer covers all four share types and
 * the public page never branches on what was shared. A subject's children are
 * its milestones and loose tasks; a milestone's are its tasks; a task's are its
 * subtasks; a subtask's are its items.
 *
 * These types are also the sanitisation boundary: they name every field a
 * viewer is allowed to see. Nothing here carries a userId, and nothing carries
 * a resource's machine-extracted document text.
 */

export type SharedKind = "subject" | "milestone" | "task" | "subtask";

export type SharedNode = {
  id: string;
  kind: SharedKind;
  title: string;
  /** Markdown — a subject's description, or anything else's notes. */
  notes: string | null;
  /** null for a subject, which has no completion of its own. */
  isCompleted: boolean | null;
  priority: Priority | null;
  dueDate: string | null;
  recurrence: Recurrence | null;
  children: SharedNode[];
};

export type SharedResource = {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  note: string | null;
};

export type SharedPayload = {
  type: ShareType;
  /** Ancestor titles, outermost first — "Operating Systems › Memory management". */
  breadcrumb: string[];
  /** The owning subject's accent colour, so a shared task keeps its identity. */
  color: string | null;
  root: SharedNode;
  /** Only ever populated for a SUBJECT share; resources hang off a subject. */
  resources: SharedResource[];
  sharedAt: string;
};

/** Count every task-like node in the tree, for the header's progress bar. */
export function countProgress(node: SharedNode): { total: number; done: number } {
  let total = 0;
  let done = 0;
  const walk = (n: SharedNode) => {
    if (n.kind === "task") {
      total += 1;
      if (n.isCompleted) done += 1;
    }
    n.children.forEach(walk);
  };
  walk(node);
  // A shared subtask tree contains no tasks; fall back to counting the subtasks
  // themselves so the header still shows meaningful progress.
  if (total === 0) {
    const walkSubs = (n: SharedNode) => {
      n.children.forEach((c) => {
        if (c.kind === "subtask") {
          total += 1;
          if (c.isCompleted) done += 1;
        }
        walkSubs(c);
      });
    };
    walkSubs(node);
  }
  return { total, done };
}
