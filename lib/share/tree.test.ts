import { describe, expect, it } from "vitest";
import { countProgress, type SharedNode } from "./tree";

const node = (partial: Partial<SharedNode> & Pick<SharedNode, "kind">): SharedNode => ({
  id: Math.random().toString(36).slice(2),
  title: "n",
  notes: null,
  isCompleted: null,
  priority: null,
  dueDate: null,
  recurrence: null,
  children: [],
  ...partial,
});

const task = (isCompleted: boolean, children: SharedNode[] = []) =>
  node({ kind: "task", isCompleted, children });
const subtask = (isCompleted: boolean, children: SharedNode[] = []) =>
  node({ kind: "subtask", isCompleted, children });

describe("countProgress", () => {
  it("counts tasks anywhere in the tree, at any depth", () => {
    const subject = node({
      kind: "subject",
      children: [
        node({ kind: "milestone", isCompleted: false, children: [task(true), task(false)] }),
        task(true),
      ],
    });
    expect(countProgress(subject)).toEqual({ total: 3, done: 2 });
  });

  it("ignores milestones and subtasks while any task exists", () => {
    const subject = node({
      kind: "subject",
      children: [
        node({
          kind: "milestone",
          isCompleted: true, // a completed milestone is not a completed task
          children: [task(false, [subtask(true), subtask(true)])],
        }),
      ],
    });
    expect(countProgress(subject)).toEqual({ total: 1, done: 0 });
  });

  it("counts the root task itself, not just its descendants", () => {
    expect(countProgress(task(true, [subtask(false)]))).toEqual({ total: 1, done: 1 });
  });

  // A shared subtask's tree contains no tasks at all, so a naive task-only
  // count would render a permanent 0/0 and hide the progress bar entirely.
  it("falls back to counting subtasks when the tree holds no tasks", () => {
    const parent = subtask(false, [subtask(true), subtask(false), subtask(true)]);
    expect(countProgress(parent)).toEqual({ total: 3, done: 2 });
  });

  it("reports nothing for a shared leaf item, which has no children", () => {
    expect(countProgress(subtask(false))).toEqual({ total: 0, done: 0 });
  });

  it("treats an empty subject as zero rather than dividing by it", () => {
    expect(countProgress(node({ kind: "subject" }))).toEqual({ total: 0, done: 0 });
  });
});
