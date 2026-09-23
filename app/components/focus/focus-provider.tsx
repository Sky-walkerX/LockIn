"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";
import { useTaskTimer } from "@/hooks/useTasks";
import { appendNote } from "@/lib/notes/append";
import { DEFAULT_FOCUS_PREFS, phaseAfter, phaseSeconds, secondsLeft, type FocusPrefs, type Phase } from "@/lib/focus/cycle";
import {
  IDLE_RUN,
  loadFocusPrefs,
  loadFocusRun,
  saveFocusPrefs,
  saveFocusRun,
  type FocusMode,
  type FocusRun,
} from "@/lib/focus/storage";
import { chime } from "./chime";

// The focus timer lives here rather than on /focus so it keeps running while
// you move around the app, and survives a reload (the run is in localStorage).
// Only focus phases touch the server: start/stop open and close a
// TimerSession; breaks are purely local.

export const PHASE_LABEL: Record<Phase, string> = { focus: "Focus", short: "Short break", long: "Long break" };

// A phase end noticed this late happened while the tab was asleep or closed.
// Don't chain the next phase off it, or a reopened tab would find itself
// several sessions into a cycle nobody sat through.
const LATE_MS = 5000;

type FocusContext = {
  run: FocusRun;
  prefs: FocusPrefs;
  running: boolean;
  /** Seconds left in a Pomodoro phase, or elapsed on the stopwatch. */
  clock: number;
  /** 0–1 through the current Pomodoro phase. */
  progress: number;
  /** A focus session just ended on this task: offer to note what got done. */
  recapTaskId: string | null;
  selectTask: (taskId: string) => void;
  setMode: (mode: FocusMode) => void;
  start: () => void;
  stop: () => void;
  skipBreak: () => void;
  setPrefs: (prefs: FocusPrefs) => void;
  saveRecap: (text: string) => Promise<void>;
  dismissRecap: () => void;
};

const Ctx = createContext<FocusContext | null>(null);
export function useFocus(): FocusContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFocus outside FocusProvider");
  return ctx;
}

export const fmtClock = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { mutate: timer } = useTaskTimer();
  const [run, setRunState] = useState<FocusRun>(IDLE_RUN);
  const [prefs, setPrefsState] = useState<FocusPrefs>(DEFAULT_FOCUS_PREFS);
  const [now, setNow] = useState(() => Date.now());
  const [recapTaskId, setRecapTaskId] = useState<string | null>(null);

  // Read storage after mount: doing it during render would desync SSR.
  useEffect(() => {
    setPrefsState(loadFocusPrefs());
    setRunState(loadFocusRun());
  }, []);

  const setRun = useCallback((next: FocusRun) => {
    setRunState(next);
    saveFocusRun(next);
  }, []);

  const setPrefs = useCallback((next: FocusPrefs) => {
    setPrefsState(next);
    saveFocusPrefs(next);
  }, []);

  const running = run.startedAt !== null;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const announce = useCallback(
    (ended: Phase, next: Phase) => {
      if (prefs.sound) chime();
      if (prefs.notify && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(ended === "focus" ? "Focus session done" : "Break's over", {
          body: `${PHASE_LABEL[next]} next.`,
          tag: "lockin-focus",
        });
      }
    },
    [prefs.sound, prefs.notify],
  );

  // Phase end. Keyed on the phase's start time so it fires once per phase even
  // though the effect re-runs every tick.
  const endedRef = useRef<number | null>(null);
  useEffect(() => {
    if (run.mode !== "pomodoro" || run.startedAt === null) return;
    const endAt = run.startedAt + phaseSeconds(run.phase, prefs) * 1000;
    if (now < endAt || endedRef.current === run.startedAt) return;
    endedRef.current = run.startedAt;

    const late = Date.now() - endAt > LATE_MS;
    const focusDone = run.phase === "focus" ? run.focusDone + 1 : run.focusDone;
    if (run.phase === "focus") {
      timer({ id: run.taskId, action: "stop", endedAt: new Date(endAt).toISOString() });
      setRecapTaskId(run.taskId);
    }
    const next = phaseAfter(run.phase, focusDone, prefs);
    const auto = prefs.autoStartNext && !late;
    if (auto && next === "focus") timer({ id: run.taskId, action: "start" });
    setRun({ ...run, phase: next, focusDone, startedAt: auto ? Date.now() : null });
    if (!late) announce(run.phase, next);
  }, [now, run, prefs, timer, setRun, announce]);

  const total = phaseSeconds(run.phase, prefs);
  const clock =
    run.mode === "stopwatch"
      ? run.startedAt === null
        ? 0
        : Math.floor((now - run.startedAt) / 1000)
      : run.startedAt === null
        ? total
        : secondsLeft(run.startedAt, now, total);
  const progress = run.mode === "pomodoro" ? 1 - clock / total : 0;

  // The tab title carries the countdown, so it reads from any other tab. The
  // page's own title is kept aside and put back when the timer stops.
  const pageTitle = useRef<string | null>(null);
  useEffect(() => {
    if (running) {
      pageTitle.current ??= document.title;
      document.title = `${fmtClock(clock)} · ${run.mode === "stopwatch" ? "Stopwatch" : PHASE_LABEL[run.phase]}`;
    } else if (pageTitle.current !== null) {
      document.title = pageTitle.current;
      pageTitle.current = null;
    }
  }, [running, clock, run.mode, run.phase]);

  const selectTask = useCallback(
    (taskId: string) => {
      if (!running) setRun({ ...run, taskId });
    },
    [run, running, setRun],
  );

  const setMode = useCallback(
    (mode: FocusMode) => {
      if (!running) setRun({ ...IDLE_RUN, taskId: run.taskId, mode });
    },
    [run.taskId, running, setRun],
  );

  const start = useCallback(() => {
    if (running || !run.taskId) return;
    if (run.mode === "stopwatch" || run.phase === "focus") timer({ id: run.taskId, action: "start" });
    setRun({ ...run, startedAt: Date.now() });
  }, [run, running, timer, setRun]);

  const stop = useCallback(() => {
    if (running && (run.mode === "stopwatch" || run.phase === "focus")) {
      timer({ id: run.taskId, action: "stop" });
      setRecapTaskId(run.taskId);
    }
    setRun({ ...IDLE_RUN, taskId: run.taskId, mode: run.mode });
  }, [run, running, timer, setRun]);

  const skipBreak = useCallback(() => {
    if (run.phase === "focus") return;
    const auto = prefs.autoStartNext;
    if (auto) timer({ id: run.taskId, action: "start" });
    setRun({ ...run, phase: "focus", startedAt: auto ? Date.now() : null });
  }, [run, prefs.autoStartNext, timer, setRun]);

  const saveRecap = useCallback(
    async (text: string) => {
      const taskId = recapTaskId;
      setRecapTaskId(null);
      if (!taskId || !text.trim()) return;
      // Read the description fresh rather than from cache, so a note edited
      // during the session isn't overwritten by a stale copy.
      const tasks = await api.get<Task[]>("/api/tasks");
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      await api.put(`/api/tasks/${taskId}`, {
        description: appendNote(task.description ?? "", text, "from focus"),
      });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["subject", task.subjectId] });
    },
    [recapTaskId, qc],
  );

  const dismissRecap = useCallback(() => setRecapTaskId(null), []);

  const value = useMemo(
    () => ({
      run,
      prefs,
      running,
      clock,
      progress,
      recapTaskId,
      selectTask,
      setMode,
      start,
      stop,
      skipBreak,
      setPrefs,
      saveRecap,
      dismissRecap,
    }),
    [run, prefs, running, clock, progress, recapTaskId, selectTask, setMode, start, stop, skipBreak, setPrefs, saveRecap, dismissRecap],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
