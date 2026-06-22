"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { FocusTimer } from "@/app/components/timer";

const FALLBACK = "#8b8f9e";

function fmt(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function FocusPage() {
  const { status } = useSession({ required: true });
  const { data: tasks = [] } = useTasks();
  const { data: subjects = [] } = useSubjects();

  const subjectMap = useMemo(() => {
    const m = new Map<string, { title: string; color: string | null }>();
    for (const s of subjects) m.set(s.id, { title: s.title, color: s.color });
    return m;
  }, [subjects]);

  const logged = useMemo(
    () => tasks.filter((t) => (t.timeSpent ?? 0) > 0).sort((a, b) => (b.timeSpent ?? 0) - (a.timeSpent ?? 0)),
    [tasks],
  );
  const totalMinutes = logged.reduce((s, t) => s + (t.timeSpent ?? 0), 0);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-2xl px-5 py-10 md:px-8">
        <p className="lk-mono text-sm text-muted-foreground">loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-6 md:px-8">
      <h1 className="lk-display mb-5 text-2xl font-black tracking-tight">Focus</h1>

      <FocusTimer />

      <div className="lk-sec mt-8 mb-3">time logged · {fmt(totalMinutes)}</div>
      {logged.length === 0 ? (
        <div className="lk-card p-5 text-center">
          <p className="text-sm text-muted-foreground">No focus time logged yet. Start a session above.</p>
        </div>
      ) : (
        <div className="lk-card flex flex-col gap-0.5 p-2">
          {logged.slice(0, 10).map((t) => {
            const subj = subjectMap.get(t.subjectId);
            return (
              <div
                key={t.id}
                className="lk-subject flex items-center gap-3 px-2 py-1.5"
                style={{ "--c": subj?.color ?? FALLBACK } as React.CSSProperties}
              >
                <span className="lk-swatch" />
                <span className={`flex-1 truncate text-sm ${t.isCompleted ? "text-muted-foreground line-through" : ""}`}>
                  {t.title}
                </span>
                <span className="lk-mono hidden text-[11px] text-muted-foreground sm:inline">{subj?.title}</span>
                <span className="lk-mono text-[11px] font-bold uppercase tracking-wide">{fmt(t.timeSpent ?? 0)}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="lk-statusbar mt-10">
        <span className="seg mode">LOCKIN</span>
        <span className="seg">{fmt(totalMinutes)} focused</span>
        <span className="seg">{logged.length} tasks</span>
        <span className="seg grow" />
        <span className="seg">~/lockin/focus</span>
      </div>
    </main>
  );
}
