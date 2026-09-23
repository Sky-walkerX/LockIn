import { normalizeFocusPrefs, type FocusPrefs, type Phase } from "./cycle";

// Timer lengths and the running timer live in localStorage, like the LLM
// settings: they belong to this browser, and the running timer has to survive
// a reload without a round trip.

const PREFS_KEY = "lockin.focus.prefs";
const RUN_KEY = "lockin.focus.run";

export type FocusMode = "pomodoro" | "stopwatch";

export interface FocusRun {
  taskId: string;
  mode: FocusMode;
  phase: Phase;
  startedAt: number | null; // epoch ms; null while waiting to start the phase
  focusDone: number; // focus sessions finished in this cycle
}

export const IDLE_RUN: FocusRun = { taskId: "", mode: "pomodoro", phase: "focus", startedAt: null, focusDone: 0 };

function read(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the timer still works, it just won't survive a reload.
  }
}

export const loadFocusPrefs = (): FocusPrefs => normalizeFocusPrefs(read(PREFS_KEY) as Partial<FocusPrefs> | null);
export const saveFocusPrefs = (prefs: FocusPrefs) => write(PREFS_KEY, prefs);

export function loadFocusRun(): FocusRun {
  const r = read(RUN_KEY) as Partial<FocusRun> | null;
  if (!r || typeof r !== "object") return IDLE_RUN;
  return {
    taskId: typeof r.taskId === "string" ? r.taskId : "",
    mode: r.mode === "stopwatch" ? "stopwatch" : "pomodoro",
    phase: r.phase === "short" || r.phase === "long" ? r.phase : "focus",
    startedAt: typeof r.startedAt === "number" ? r.startedAt : null,
    focusDone: typeof r.focusDone === "number" ? r.focusDone : 0,
  };
}
export const saveFocusRun = (run: FocusRun) => write(RUN_KEY, run);
