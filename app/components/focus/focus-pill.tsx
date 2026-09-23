"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PHASE_LABEL, fmtClock, useFocus } from "./focus-provider";

/** The running timer, visible from anywhere but the focus page itself. */
export function FocusPill() {
  const pathname = usePathname();
  const { run, running, clock } = useFocus();
  if (!running || pathname === "/focus") return null;
  const onBreak = run.mode === "pomodoro" && run.phase !== "focus";
  const label = run.mode === "stopwatch" ? "Stopwatch" : PHASE_LABEL[run.phase];
  return (
    <Link
      href="/focus"
      title={`${label} running — open the timer`}
      className="lk-mono flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] tabular-nums tracking-wide transition-colors hover:text-foreground"
      style={{ color: onBreak ? "var(--lk-ok)" : undefined }}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "currentColor" }} />
      {fmtClock(clock)}
    </Link>
  );
}
