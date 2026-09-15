export type RevealKind = "milestone" | "task" | "subtask";
export type RevealTarget = { kind: RevealKind; id: string };

type TreeSubtask = { id: string; children?: TreeSubtask[] };
type TreeTask = { id: string; subtasks: TreeSubtask[] };
/** The parts of a subject detail that decide which rows sit above which. */
export type RevealTree = { milestones: { id: string; tasks: TreeTask[] }[]; tasks: TreeTask[] };

const KINDS: readonly string[] = ["milestone", "task", "subtask"];

/** Read `?open=<kind>:<id>` from a search result link. Anything malformed is ignored. */
export function parseOpen(param: string | null): RevealTarget | null {
  if (!param) return null;
  const sep = param.indexOf(":");
  const kind = param.slice(0, sep);
  const id = param.slice(sep + 1);
  if (sep === -1 || !KINDS.includes(kind) || !id) return null;
  return { kind: kind as RevealKind, id };
}

/**
 * The ids of every row to expand so the target shows, outermost first and
 * ending with the target itself (opening it shows its notes). Null when the
 * target has been deleted or moved to another subject since the link was made.
 */
export function revealPath(tree: RevealTree, target: RevealTarget): string[] | null {
  const inSubtasks = (list: TreeSubtask[], trail: string[]): string[] | null => {
    for (const s of list) {
      const here = [...trail, s.id];
      if (s.id === target.id) return here;
      const found = inSubtasks(s.children ?? [], here);
      if (found) return found;
    }
    return null;
  };

  const inTasks = (list: TreeTask[], trail: string[]): string[] | null => {
    for (const t of list) {
      const here = [...trail, t.id];
      if (t.id === target.id) return here;
      const found = inSubtasks(t.subtasks, here);
      if (found) return found;
    }
    return null;
  };

  for (const m of tree.milestones) {
    if (m.id === target.id) return [m.id];
    const found = inTasks(m.tasks, [m.id]);
    if (found) return found;
  }
  return inTasks(tree.tasks, []);
}
