"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { useTasks, useTaskTimer } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

const POMODORO = 25 * 60;
const FALLBACK = "#8b8f9e";

export function FocusTimer() {
  const { data: tasks = [] } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const timer = useTaskTimer();

  const incomplete = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);
  const subjectMap = useMemo(() => {
    const m = new Map<string, { title: string; color: string | null }>();
    for (const s of subjects) m.set(s.id, { title: s.title, color: s.color });
    return m;
  }, [subjects]);

  const [taskId, setTaskId] = useState("");
  const [mode, setMode] = useState<"pomodoro" | "stopwatch">("pomodoro");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selected = incomplete.find((t) => t.id === taskId) ?? null;
  const color = selected ? subjectMap.get(selected.subjectId)?.color ?? FALLBACK : FALLBACK;

  const start = () => {
    if (!taskId) return;
    timer.mutate({ id: taskId, action: "start" });
    setElapsed(0);
    setRunning(true);
  };

  const stop = () => {
    if (taskId) timer.mutate({ id: taskId, action: "stop" });
    setRunning(false);
    setElapsed(0);
  };

  // 1-second tick while running
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Auto-stop a Pomodoro when it hits 25:00
  useEffect(() => {
    if (running && mode === "pomodoro" && elapsed >= POMODORO) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, running, mode]);

  const shown = mode === "pomodoro" ? Math.max(0, POMODORO - elapsed) : elapsed;
  const mm = Math.floor(shown / 60).toString().padStart(2, "0");
  const ss = (shown % 60).toString().padStart(2, "0");
  const pct = mode === "pomodoro" ? ((POMODORO - Math.max(0, POMODORO - elapsed)) / POMODORO) * 100 : 0;

  return (
    <div
      className="lk-subject lk-card p-6"
      style={{ "--c": color } as React.CSSProperties}
    >
      {/* Mode toggle */}
      <div className="mb-6 flex justify-center gap-2">
        {(["pomodoro", "stopwatch"] as const).map((m) => (
          <button
            key={m}
            type="button"
            disabled={running}
            onClick={() => {
              setMode(m);
              setElapsed(0);
            }}
            className={`lk-mono rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-wide transition-colors disabled:opacity-50 ${
              mode === m
                ? "border-foreground bg-foreground text-background font-bold"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "pomodoro" ? "Pomodoro" : "Stopwatch"}
          </button>
        ))}
      </div>

      {/* Clock */}
      <div className="text-center">
        <div className="lk-mono text-7xl font-bold tabular-nums leading-none" style={{ color: "var(--c-eff)" }}>
          {mm}:{ss}
        </div>
        <div className="lk-mono mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {running ? "focusing…" : mode === "pomodoro" ? "25 min focus" : "open stopwatch"}
        </div>
      </div>

      {/* Pomodoro progress */}
      {mode === "pomodoro" && (
        <div className="lk-bar mx-auto mt-5 max-w-xs">
          <i style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Task picker */}
      <div className="mx-auto mt-6 max-w-xs">
        <div className="lk-sec mb-2">working on</div>
        {incomplete.length === 0 ? (
          <p className="lk-mono text-xs text-muted-foreground">No open tasks — add some first.</p>
        ) : (
          <Select value={taskId} onValueChange={setTaskId} disabled={running}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {incomplete.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {subjectMap.get(t.subjectId)?.title
                    ? `${subjectMap.get(t.subjectId)!.title} · ${t.title}`
                    : t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex justify-center">
        {running ? (
          <button type="button" onClick={stop} className="lk-btn flex items-center gap-2 px-6 py-2.5 text-xs">
            <Square size={14} /> Stop &amp; log
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={!taskId}
            className="lk-btn flex items-center gap-2 px-6 py-2.5 text-xs disabled:opacity-50"
          >
            <Play size={14} /> Start
          </button>
        )}
      </div>

      {selected && (selected.timeSpent ?? 0) > 0 && (
        <div className="lk-mono mt-4 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
          {selected.timeSpent}m logged on this task
        </div>
      )}
    </div>
  );
}
