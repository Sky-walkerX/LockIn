"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Play, Settings2, SkipForward, Square } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useSubjects } from "@/hooks/useSubjects";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { PHASE_LABEL, fmtClock, useFocus } from "./focus/focus-provider";
import { FocusSettings } from "./focus/focus-settings";

const FALLBACK = "#8b8f9e";

export function FocusTimer() {
  const { data: tasks = [] } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const focus = useFocus();
  const { run, prefs, running, clock, progress } = focus;

  const incomplete = useMemo(() => tasks.filter((t) => !t.isCompleted), [tasks]);
  const subjectMap = useMemo(() => {
    const m = new Map<string, { title: string; color: string | null }>();
    for (const s of subjects) m.set(s.id, { title: s.title, color: s.color });
    return m;
  }, [subjects]);

  const selected = tasks.find((t) => t.id === run.taskId) ?? null;
  const color = selected ? (subjectMap.get(selected.subjectId)?.color ?? FALLBACK) : FALLBACK;
  const pomodoro = run.mode === "pomodoro";
  const onBreak = pomodoro && run.phase !== "focus";

  // Full screen is the card itself, stripped down to the clock.
  const cardRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === cardRef.current && cardRef.current !== null);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFull = () =>
    full ? document.exitFullscreen() : cardRef.current?.requestFullscreen().catch(() => {});

  const status = running
    ? pomodoro
      ? PHASE_LABEL[run.phase].toLowerCase()
      : "focusing…"
    : pomodoro
      ? run.phase === "focus"
        ? `${prefs.focusMin} min focus`
        : `${PHASE_LABEL[run.phase].toLowerCase()} up next`
      : "open stopwatch";

  const controls = (
    <div className="flex items-center justify-center gap-2">
      {running ? (
        <button type="button" onClick={focus.stop} className="lk-btn flex items-center gap-2 px-6 py-2.5 text-xs">
          <Square size={14} /> {onBreak ? "End break" : "Stop & log"}
        </button>
      ) : (
        <button
          type="button"
          onClick={focus.start}
          disabled={!run.taskId}
          className="lk-btn flex items-center gap-2 px-6 py-2.5 text-xs disabled:opacity-50"
        >
          <Play size={14} /> {onBreak ? "Start break" : "Start"}
        </button>
      )}
      {onBreak && (
        <button
          type="button"
          onClick={focus.skipBreak}
          className="lk-mono flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[10.5px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          <SkipForward size={13} /> Skip break
        </button>
      )}
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`lk-subject lk-card relative p-6 ${full ? "flex flex-col items-center justify-center gap-8 bg-background" : ""}`}
      style={{ "--c": color } as React.CSSProperties}
    >
      <div className="absolute right-3 top-3 flex items-center">
        {!full && (
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="lk-iconbtn" title="Timer settings">
                <Settings2 size={15} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[22rem]">
              <div className="lk-sec mb-3">Timer</div>
              <FocusSettings />
            </PopoverContent>
          </Popover>
        )}
        <button type="button" onClick={toggleFull} className="lk-iconbtn" title={full ? "Exit full screen" : "Full screen"}>
          {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {!full && (
        <div className="mb-6 flex justify-center gap-2">
          {(["pomodoro", "stopwatch"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={running}
              onClick={() => focus.setMode(m)}
              className={`lk-mono rounded-md border px-3 py-1.5 text-[10px] uppercase tracking-wide transition-colors disabled:opacity-50 ${
                run.mode === m
                  ? "border-foreground bg-foreground text-background font-bold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "pomodoro" ? "Pomodoro" : "Stopwatch"}
            </button>
          ))}
        </div>
      )}

      {full && selected && <div className="lk-display text-center text-2xl font-bold">{selected.title}</div>}

      <div className="text-center">
        <div
          className={`lk-mono font-bold tabular-nums leading-none ${full ? "text-[9rem]" : "text-7xl"}`}
          style={{ color: onBreak ? "var(--lk-ok)" : "var(--c-eff)" }}
          role="timer"
        >
          {fmtClock(clock)}
        </div>
        <div className="lk-mono mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{status}</div>
      </div>

      {pomodoro && (
        <div className={`mx-auto mt-5 w-full ${full ? "max-w-md" : "max-w-xs"}`}>
          <div className="lk-bar">
            <i style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-2 flex justify-center gap-1.5" title={`${run.focusDone % prefs.longEvery} of ${prefs.longEvery} before a long break`}>
            {Array.from({ length: prefs.longEvery }, (_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: i < run.focusDone % prefs.longEvery ? "var(--c-eff)" : "var(--border)" }}
              />
            ))}
          </div>
        </div>
      )}

      {!full && (
        <div className="mx-auto mt-6 max-w-xs">
          <div className="lk-sec mb-2">working on</div>
          {incomplete.length === 0 ? (
            <p className="lk-mono text-xs text-muted-foreground">No open tasks — add some first.</p>
          ) : (
            <Select value={run.taskId} onValueChange={focus.selectTask} disabled={running}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {incomplete.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {subjectMap.get(t.subjectId)?.title ? `${subjectMap.get(t.subjectId)!.title} · ${t.title}` : t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <div className={full ? "" : "mt-6"}>{controls}</div>

      {focus.recapTaskId && <Recap key={focus.recapTaskId} />}

      {!full && selected && (selected.timeSpent ?? 0) > 0 && (
        <div className="lk-mono mt-4 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
          {selected.timeSpent}m logged on this task
        </div>
      )}
    </div>
  );
}

// After a focus session: one line on what got done, filed into the task's notes.
function Recap() {
  const { saveRecap, dismissRecap } = useFocus();
  const [text, setText] = useState("");
  return (
    <form
      className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        saveRecap(text);
      }}
    >
      <label htmlFor="focus-recap" className="lk-sec">
        what did you get done?
      </label>
      <div className="flex gap-2">
        <Input
          id="focus-recap"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Optional — saved to the task's notes"
        />
        <button type="submit" disabled={!text.trim()} className="lk-btn px-3 text-[10.5px] disabled:opacity-50">
          Save
        </button>
      </div>
      <button
        type="button"
        onClick={dismissRecap}
        className="lk-mono self-start text-[10.5px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        Skip
      </button>
    </form>
  );
}
