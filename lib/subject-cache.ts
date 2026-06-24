import type { QueryClient } from "@tanstack/react-query";
import type { SubjectDetail, TaskWithSubtasks } from "@/hooks/useSubjects";
import type { Subtask } from "@/app/generated/prisma";

// Helpers for optimistically patching the ["subject", id] detail caches so
// completion toggles and reorders feel instant instead of waiting on a round
// trip + refetch. Each helper returns a fresh SubjectDetail.

const SUBJECT_KEY = ["subject"] as const;
type Snapshot = [readonly unknown[], SubjectDetail | undefined][];

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

// Apply `fn` to every task in the subject (milestone tasks + loose tasks).
export function mapTasks(
  s: SubjectDetail,
  fn: (t: TaskWithSubtasks) => TaskWithSubtasks,
): SubjectDetail {
  return {
    ...s,
    milestones: s.milestones.map((m) => ({ ...m, tasks: m.tasks.map(fn) })),
    tasks: s.tasks.map(fn),
  };
}

// Apply `fn` to every subtask in the subject.
export function mapSubtasks(s: SubjectDetail, fn: (st: Subtask) => Subtask): SubjectDetail {
  return mapTasks(s, (t) => ({ ...t, subtasks: t.subtasks.map(fn) }));
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
  return {
    ...s,
    milestones: s.milestones.map((m) => ({ ...m, tasks: reorder(m.tasks) })),
    tasks: reorder(s.tasks),
  };
}

// Reorder whichever task's subtask list exactly matches `ids`.
export function reorderSubtaskList(s: SubjectDetail, ids: string[]): SubjectDetail {
  const idSet = new Set(ids);
  const reorder = (arr: Subtask[]) => {
    if (arr.length !== ids.length || !arr.every((st) => idSet.has(st.id))) return arr;
    const byId = new Map(arr.map((st) => [st.id, st]));
    return ids.map((id) => byId.get(id)!);
  };
  return mapTasks(s, (t) => ({ ...t, subtasks: reorder(t.subtasks) }));
}
