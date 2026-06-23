"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2, Flame, Trophy, Clock, ListTodo, CalendarCheck } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { useSubjects } from "@/hooks/useSubjects";
import { StatCard } from "./analytics/stats-card";
import { ActivityHeatmap } from "./analytics/heatmap";

const FALLBACK = "#8b8f9e";
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

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
      <main className="w-full px-4 py-10 sm:px-6 lg:px-10 xl:px-16">
        <p className="lk-mono text-sm text-muted-foreground">loading…</p>
      </main>
    );
  }

  const weekMax = Math.max(...stats.weeklyProgress, 1);
  const weekTotal = stats.weeklyProgress.reduce((a, b) => a + b, 0);
  const todayIdx = new Date().getDay();

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
      <h1 className="lk-display mb-5 text-2xl font-black tracking-tight">Progress</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={CheckCircle2} label="Completed" value={stats.totalCompleted} sub="all time" />
        <StatCard icon={CalendarCheck} label="Today" value={stats.completedToday} sub="tasks done" />
        <StatCard icon={Flame} label="Streak" value={`${stats.currentStreak}d`} sub="current run" />
        <StatCard icon={Trophy} label="Best streak" value={`${stats.longestStreak}d`} sub="last 30 days" />
        <StatCard icon={Clock} label="Focus time" value={fmtMinutes(stats.totalFocusMinutes)} sub="logged" />
        <StatCard icon={ListTodo} label="Active" value={stats.activeTasks} sub="open tasks" />
      </div>

      {/* This week */}
      <div className="lk-sec mt-7 mb-3">this week · {weekTotal} completed</div>
      <div className="lk-card p-4">
        <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
          {stats.weeklyProgress.map((count, i) => {
            const h = Math.round((count / weekMax) * 100);
            const isToday = i === todayIdx;
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1.5" style={{ height: "100%" }}>
                <span className="lk-mono text-[10px] text-muted-foreground">{count > 0 ? count : ""}</span>
                <div
                  className="w-full rounded-[4px]"
                  style={{
                    height: `${Math.max(h, count > 0 ? 6 : 2)}%`,
                    background: count > 0 ? "var(--accent)" : "var(--lk-bar-track)",
                    minHeight: 3,
                  }}
                />
                <span
                  className={`lk-mono text-[10px] uppercase ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
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
                <span className="lk-mono w-24 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.completedTasks}/{s.totalTasks} · {pct}%
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="lk-statusbar mt-10">
        <span className="seg mode">LOCKIN</span>
        <span className="seg">{stats.totalCompleted} completed</span>
        <span className="seg">{stats.currentStreak}d streak</span>
        <span className="seg">{fmtMinutes(stats.totalFocusMinutes)} focus</span>
        <span className="seg grow" />
        <span className="seg">~/lockin/progress</span>
      </div>
    </main>
  );
}
