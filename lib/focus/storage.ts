import { normalizeFocusPrefs, type FocusPrefs, type Phase } from "./cycle";

// Timer lengths and the running timer live in localStorage, like the LLM
// settings: they belong to this browser, and the running timer has to survive
// a reload without a round trip.

export const PREFS_KEY = "lockin.focus.prefs";
export const RUN_KEY = "lockin.focus.run";

export type FocusMode = "pomodoro" | "stopwatch";

export interface FocusRun {
  taskId: string;
  mode: FocusMode;
  phase: Phase;
  startedAt: number | null; // epoch ms; null while waiting to start the phase
  focusDone: number; // focus sessions finished in this cycle
}

export const IDLE_RUN: FocusRun = { taskId: "", mode: "pomodoro", phase: "focus", startedAt: null, focusDone: 0 };

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Parsers for what's stored under PREFS_KEY and RUN_KEY. Anything missing or
// malformed falls back to defaults, so an older or hand-edited value loads.
export const parseFocusPrefs = (raw: string | null): FocusPrefs =>
  normalizeFocusPrefs(parse(raw) as Partial<FocusPrefs> | null);

export function parseFocusRun(raw: string | null): FocusRun {
  const r = parse(raw) as Partial<FocusRun> | null;
  if (!r || typeof r !== "object") return IDLE_RUN;
  return {
    taskId: typeof r.taskId === "string" ? r.taskId : "",
    mode: r.mode === "stopwatch" ? "stopwatch" : "pomodoro",
    phase: r.phase === "short" || r.phase === "long" ? r.phase : "focus",
    startedAt: typeof r.startedAt === "number" ? r.startedAt : null,
    focusDone: typeof r.focusDone === "number" ? r.focusDone : 0,
  };
}
