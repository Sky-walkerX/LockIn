import type { QueryClient } from "@tanstack/react-query";
import type { SubjectDetail, MilestoneWithTasks } from "@/hooks/useSubjects";
import type { Milestone } from "@/app/generated/prisma/client";

// Helpers for optimistically patching the ["subject", id] detail caches so
// creates and edits feel instant instead of waiting on a round trip +
// refetch. Each helper returns a fresh SubjectDetail.
//
// All mappers preserve object identity for untouched entries so memoized rows
// (React.memo) can bail out of re-rendering.

const SUBJECT_KEY = ["subject"] as const;
type Snapshot = [readonly unknown[], SubjectDetail | undefined][];

// Optimistically created entities carry a temp id until the server responds;
// rows guard on isTempId to block edits against ids the server
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

export function addMilestoneToSubject(s: SubjectDetail, m: MilestoneWithTasks): SubjectDetail {
  return s.id === m.subjectId ? { ...s, milestones: [...s.milestones, m] } : s;
}

export function replaceMilestone(s: SubjectDetail, tmpId: string, real: Milestone): SubjectDetail {
  const milestones = mapList(s.milestones, (m) =>
    m.id === tmpId ? { ...real, tasks: m.tasks } : m,
  );
  return milestones === s.milestones ? s : { ...s, milestones };
}

