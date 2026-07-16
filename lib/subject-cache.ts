import type { QueryClient } from "@tanstack/react-query";
import type {
  SubjectDetail,
  SubtaskWithChildren,
  TaskWithSubtasks,
  MilestoneWithTasks,
} from "@/hooks/useSubjects";
import type { Milestone, Subtask, Task } from "@/app/generated/prisma";

// Helpers for optimistically patching the ["subject", id] detail caches so
// completion toggles, creates, and reorders feel instant instead of waiting on
// a round trip + refetch. Each helper returns a fresh SubjectDetail.
//
// All mappers preserve object identity for untouched entries so memoized rows
// (React.memo) can bail out of re-rendering.

const SUBJECT_KEY = ["subject"] as const;
type Snapshot = [readonly unknown[], SubjectDetail | undefined][];

// Optimistically created entities carry a temp id until the server responds;
// rows guard on isTempId to block edits/reorders against ids the server
// doesn't know yet.
export const TEMP_PREFIX = "temp-";
export const isTempId = (id: string) => id.startsWith(TEMP_PREFIX);
export function tempId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${TEMP_PREFIX}${rand}`;
}

// Cancel in-flight subject fetches, apply `patch` to every subject-detail cache,
// and return a snapshot for rollback on error.
export async function patchSubjectCaches(
  qc: QueryClient,
  patch: (s: SubjectDetail) => SubjectDetail,
): Promise<Snapshot> {
  await qc.cancelQueries({ queryKey: SUBJECT_KEY });
  const prev = qc.getQueriesData<SubjectDetail>({ queryKey: SUBJECT_KEY });
  qc.setQueriesData<SubjectDetail>({ queryKey: SUBJECT_KEY }, (old) => (old ? patch(old) : old));
  return prev;
}

export function restoreSubjectCaches(qc: QueryClient, prev: Snapshot | undefined) {
  prev?.forEach(([key, data]) => qc.setQueryData(key, data));
}

// map that returns the original array when no element changed.
function mapList<T>(arr: T[], fn: (x: T) => T): T[] {
  let changed = false;
  const out = arr.map((x) => {
    const y = fn(x);
    if (y !== x) changed = true;
    return y;
  });
  return changed ? out : arr;
}

// Apply `fn` to every task in the subject (milestone tasks + loose tasks).
export function mapTasks(
  s: SubjectDetail,
  fn: (t: TaskWithSubtasks) => TaskWithSubtasks,
): SubjectDetail {
  const milestones = mapList(s.milestones, (m) => {
    const tasks = mapList(m.tasks, fn);
    return tasks === m.tasks ? m : { ...m, tasks };
  });
  const tasks = mapList(s.tasks, fn);
  return milestones === s.milestones && tasks === s.tasks ? s : { ...s, milestones, tasks };
}

// Apply `fn` to every subtask in the subject — top-level rows and their
// children (`fn` spreads, so a parent's `children` array survives it).
export function mapSubtasks(s: SubjectDetail, fn: (st: Subtask) => Subtask): SubjectDetail {
  const mapNode = (p: SubtaskWithChildren): SubtaskWithChildren => {
    const children = mapList(p.children, fn);
    const self = fn(p) as SubtaskWithChildren;
    if (self === p && children === p.children) return p;
    return { ...self, children };
  };
  return mapTasks(s, (t) => {
    const subtasks = mapList(t.subtasks, mapNode);
    return subtasks === t.subtasks ? t : { ...t, subtasks };
  });
}

// Append an optimistic task to its milestone's list, or the loose list.
export function addTaskToSubject(s: SubjectDetail, task: TaskWithSubtasks): SubjectDetail {
  if (s.id !== task.subjectId) return s;
  if (task.milestoneId) {
    const milestones = mapList(s.milestones, (m) =>
      m.id === task.milestoneId ? { ...m, tasks: [...m.tasks, task] } : m,
    );
    return milestones === s.milestones ? s : { ...s, milestones };
  }
  return { ...s, tasks: [...s.tasks, task] };
}

// Swap a temp task for the server one, keeping any optimistic subtasks.
export function replaceTask(s: SubjectDetail, tmpId: string, real: Task): SubjectDetail {
  return mapTasks(s, (t) => (t.id === tmpId ? { ...real, subtasks: t.subtasks } : t));
}

// Append an optimistic subtask to its parent's children, or the task's
// top-level list.
export function addSubtaskToTask(s: SubjectDetail, subtask: SubtaskWithChildren): SubjectDetail {
  return mapTasks(s, (t) => {
    if (t.id !== subtask.taskId) return t;
    if (subtask.parentId) {
      const subtasks = mapList(t.subtasks, (p) =>
        p.id === subtask.parentId ? { ...p, children: [...p.children, subtask] } : p,
      );
      return subtasks === t.subtasks ? t : { ...t, subtasks };
    }
    return { ...t, subtasks: [...t.subtasks, subtask] };
  });
}

// Swap a temp subtask for the server one. The POST response carries no
// `children`, so keep the temp row's (mirrors replaceTask).
export function replaceSubtask(s: SubjectDetail, tmpId: string, real: Subtask): SubjectDetail {
  return mapSubtasks(s, (st) => {
    if (st.id !== tmpId) return st;
    const swapped: SubtaskWithChildren = {
      ...real,
      children: (st as SubtaskWithChildren).children ?? [],
    };
    return swapped;
  });
}

export function addMilestoneToSubject(s: SubjectDetail, m: MilestoneWithTasks): SubjectDetail {
  return s.id === m.subjectId ? { ...s, milestones: [...s.milestones, m] } : s;
}

export function replaceMilestone(s: SubjectDetail, tmpId: string, real: Milestone): SubjectDetail {
  const milestones = mapList(s.milestones, (m) =>
    m.id === tmpId ? { ...real, tasks: m.tasks } : m,
  );
  return milestones === s.milestones ? s : { ...s, milestones };
}

// Reorder whichever task list (a milestone's tasks, or the loose list) exactly
// matches `ids`, leaving the others untouched.
export function reorderTaskList(s: SubjectDetail, ids: string[]): SubjectDetail {
  const idSet = new Set(ids);
  const reorder = (arr: TaskWithSubtasks[]) => {
    if (arr.length !== ids.length || !arr.every((t) => idSet.has(t.id))) return arr;
    const byId = new Map(arr.map((t) => [t.id, t]));
    return ids.map((id) => byId.get(id)!);
  };
  const milestones = mapList(s.milestones, (m) => {
    const tasks = reorder(m.tasks);
    return tasks === m.tasks ? m : { ...m, tasks };
  });
  const tasks = reorder(s.tasks);
  return milestones === s.milestones && tasks === s.tasks ? s : { ...s, milestones, tasks };
}

// Reorder whichever subtask sibling group (a task's top-level list, or one
// parent's children) exactly matches `ids`.
export function reorderSubtaskList(s: SubjectDetail, ids: string[]): SubjectDetail {
  const idSet = new Set(ids);
  const reorder = <T extends { id: string }>(arr: T[]): T[] => {
    if (arr.length !== ids.length || !arr.every((st) => idSet.has(st.id))) return arr;
    const byId = new Map(arr.map((st) => [st.id, st]));
    return ids.map((id) => byId.get(id)!);
  };
  return mapTasks(s, (t) => {
    const top = reorder(t.subtasks);
    if (top !== t.subtasks) return { ...t, subtasks: top };
    const subtasks = mapList(t.subtasks, (p) => {
      const children = reorder(p.children);
      return children === p.children ? p : { ...p, children };
    });
    return subtasks === t.subtasks ? t : { ...t, subtasks };
  });
}

// Re-sort the milestones to `ids` order (and rewrite `order`) when the id set
// matches exactly.
export function reorderMilestones(s: SubjectDetail, ids: string[]): SubjectDetail {
  const idSet = new Set(ids);
  const arr = s.milestones;
  if (arr.length !== ids.length || !arr.every((m) => idSet.has(m.id))) return s;
  const byId = new Map(arr.map((m) => [m.id, m]));
  return { ...s, milestones: ids.map((id, index) => ({ ...byId.get(id)!, order: index })) };
}
