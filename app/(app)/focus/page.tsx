"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { FocusTimer } from "@/app/components/timer";
import { Skeleton } from "@/app/components/ui/skeleton";

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
      <main className="lk-page">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="lk-page">
      <header>
        <h1 className="lk-page-title">Focus</h1>
        <p className="lk-page-sub">Time on a task, logged as you work. Pick a task, start the timer, take the breaks.</p>
      </header>

      <div className="mx-auto max-w-2xl">
        <FocusTimer />
      </div>

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
                <span className="lk-print hidden text-2xs text-muted-foreground sm:inline">{subj?.title}</span>
                <span className="lk-print text-2xs font-bold uppercase tracking-wide">{fmt(t.timeSpent ?? 0)}</span>
              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
