"use client";

import { format } from "date-fns";
import type { PaceStatus } from "@/lib/pace/pace";

export const PACE_META: Record<PaceStatus, { label: string; color: string }> = {
  none: { label: "", color: "var(--muted-foreground)" },
  ahead: { label: "ahead", color: "var(--lk-ok)" },
  "on-pace": { label: "on pace", color: "var(--muted-foreground)" },
  behind: { label: "behind", color: "var(--lk-warn)" },
  overdue: { label: "past target", color: "var(--destructive)" },
  done: { label: "covered", color: "var(--lk-ok)" },
};

/** Progress bar with a tick where coverage should be by now. */
export function PaceBar({ coverage, elapsed, showMark }: { coverage: number; elapsed: number; showMark: boolean }) {
  return (
    <div className="lk-bar">
      <i style={{ width: `${Math.round(coverage * 100)}%` }} />
      {showMark && (
        <b
          className="lk-pace-mark"
          style={{ left: `${elapsed * 100}%` }}
          title={`Where you'd be on an even pace: ${Math.round(elapsed * 100)}%`}
        />
      )}
    </div>
  );
}

/** "12 Nov · 41d left", or "today" / "passed" at the edges. */
export function countdown(target: Date | string, daysLeft: number | null): string {
  const d = new Date(target);
  const when = daysLeft === null || daysLeft === 0 ? (d < new Date() ? "passed" : "today") : `${daysLeft}d left`;
  return `${format(d, "d MMM")} · ${when}`;
}
