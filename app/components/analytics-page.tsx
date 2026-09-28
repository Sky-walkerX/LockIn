"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useAnalytics } from "@/hooks/use-analytics";
import { useSubjects } from "@/hooks/useSubjects";
import { RuledBoxes } from "./notebook/ruled-boxes";
import { ActivityHeatmap } from "./analytics/heatmap";
import { Skeleton } from "@/app/components/ui/skeleton";

const FALLBACK = "#8b8f9e";
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const days = (n: number) => `${n} day${n === 1 ? "" : "s"}`;

function fmtMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function AnalyticsPage() {
  const { status } = useSession({ required: true });
  const { data: stats, isLoading } = useAnalytics();
  const { data: subjects = [] } = useSubjects();

  if (status === "loading" || isLoading || !stats) {
    return (
      <main className="lk-page">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  const weekMax = Math.max(...stats.weeklyProgress, 1);
  const weekTotal = stats.weeklyProgress.reduce((a, b) => a + b, 0);
  const todayIdx = new Date().getDay();

  return (
    <main className="lk-page">
      <header>
        <h1 className="lk-page-title">Progress</h1>
        <p className="lk-page-sub">What you&apos;ve finished, day by day and section by section.</p>
      </header>

      {/* The record, written into the page's header boxes */}
      <RuledBoxes
        items={[
          { label: "Completed", value: stats.totalCompleted },
          { label: "Done today", value: stats.completedToday },
          { label: "Streak", value: days(stats.currentStreak) },
          { label: "Best streak", value: days(stats.longestStreak) },
          { label: "Focus time", value: fmtMinutes(stats.totalFocusMinutes) },
          { label: "Open tasks", value: stats.activeTasks },
        ]}
      />

      {/* This week */}
      <div className="lk-sec mt-7 mb-3">this week · {weekTotal} completed</div>
      <div className="lk-card p-4">
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {stats.weeklyProgress.map((count, i) => {
            const h = Math.round((count / weekMax) * 100);
            const isToday = i === todayIdx;
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
                <span className="lk-print text-2xs text-muted-foreground">{count > 0 ? count : ""}</span>
                <div
                  className="w-full rounded-[4px]"
                  style={{
                    height: `${Math.max(h, count > 0 ? 6 : 2)}%`,
                    background: count > 0 ? "var(--lk-live)" : "var(--lk-bar-track)",
                    minHeight: 3,
                  }}
                />
                <span
                  className={`lk-print text-2xs uppercase ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
                >
                  {WEEKDAYS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Heatmap */}
      <div className="lk-sec mt-7 mb-3">activity</div>
      <ActivityHeatmap />

      {/* Per-subject progress */}
      <div className="lk-sec mt-7 mb-3">subjects · {subjects.length}</div>
      {subjects.length === 0 ? (
        <div className="lk-card p-5 text-center">
          <p className="text-sm text-muted-foreground">No subjects yet.</p>
        </div>
      ) : (
        <div className="lk-card flex flex-col gap-3 p-4">
          {subjects.map((s) => {
            const pct = s.totalTasks === 0 ? 0 : Math.round((s.completedTasks / s.totalTasks) * 100);
            return (
              <Link
                key={s.id}
                href={`/subjects/${s.id}`}
                className="lk-subject group flex items-center gap-3"
                style={{ "--c": s.color ?? FALLBACK } as React.CSSProperties}
              >
                <span className="lk-swatch" />
                <span className="lk-display w-40 truncate text-sm font-bold group-hover:underline">{s.title}</span>
                <div className="lk-bar flex-1">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <span className="lk-print w-24 text-right text-2xs uppercase tracking-wide text-muted-foreground">
                  {s.completedTasks}/{s.totalTasks} · {pct}%
                </span>
              </Link>
            );
          })}
        </div>
      )}

    </main>
  );
}
