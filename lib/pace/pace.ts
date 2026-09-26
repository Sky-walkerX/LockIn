// Exam pace for a subject: how much of the syllabus is covered against how
// much of the time to the target date has gone. Shared by the subject list API
// (the home cards) and the subject header, so both read the same numbers.

export type PaceStatus = "none" | "ahead" | "on-pace" | "behind" | "overdue" | "done";

export interface PaceMilestone {
  weight: number;
  isCompleted: boolean;
  doneTasks: number;
  totalTasks: number;
}

const DAY_MS = 86_400_000;
// Within this many points of the elapsed share counts as on pace.
const BAND = 0.05;

/**
 * Share of the syllabus covered, 0–1. Each milestone counts by its weight: in
 * full when completed, otherwise by the share of its tasks done. A subject
 * with no milestones falls back to its task progress.
 */
export function computeCoverage(
  milestones: PaceMilestone[],
  fallback: { done: number; total: number } = { done: 0, total: 0 },
): number {
  const weighted = milestones.filter((m) => m.weight > 0);
  if (weighted.length === 0) return fallback.total === 0 ? 0 : fallback.done / fallback.total;
  const total = weighted.reduce((s, m) => s + m.weight, 0);
  const covered = weighted.reduce(
    (s, m) => s + m.weight * (m.isCompleted ? 1 : m.totalTasks === 0 ? 0 : m.doneTasks / m.totalTasks),
    0,
  );
  return covered / total;
}

export function computePace({
  start,
  target,
  now,
  coverage,
}: {
  start: Date;
  target: Date | null;
  now: Date;
  coverage: number;
}): { coverage: number; elapsed: number; daysLeft: number | null; status: PaceStatus; neededPerWeek: number | null } {
  if (!target) return { coverage, elapsed: 0, daysLeft: null, status: "none", neededPerWeek: null };

  const span = target.getTime() - start.getTime();
  const elapsed = span <= 0 ? 1 : Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / span));
  const msLeft = target.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.floor(msLeft / DAY_MS));
  const neededPerWeek = msLeft > 0 ? (1 - coverage) / (msLeft / DAY_MS / 7) : null;

  const status: PaceStatus =
    coverage >= 1
      ? "done"
      : msLeft <= 0
        ? "overdue"
        : coverage - elapsed > BAND
          ? "ahead"
          : elapsed - coverage > BAND
            ? "behind"
            : "on-pace";

  return { coverage, elapsed, daysLeft, status, neededPerWeek };
}

type DateLike = Date | string;

/** Pace for a subject row: measured from its start date, or from when it was created. */
export function subjectPace(
  subject: { createdAt: DateLike; startDate: DateLike | null; targetDate: DateLike | null },
  coverage: number,
  now: Date = new Date(),
) {
  return computePace({
    start: new Date(subject.startDate ?? subject.createdAt),
    target: subject.targetDate ? new Date(subject.targetDate) : null,
    now,
    coverage,
  });
}
