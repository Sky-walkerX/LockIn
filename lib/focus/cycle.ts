// The Pomodoro cycle as pure functions: focus, then a short break, with a long
// break after every `longEvery` focus sessions. Time is always derived from
// when a phase started, never counted up tick by tick, so a throttled
// background tab can't drift.

export type Phase = "focus" | "short" | "long";

export interface FocusPrefs {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longEvery: number; // focus sessions per long break
  autoStartNext: boolean;
  sound: boolean;
  notify: boolean;
}

export const DEFAULT_FOCUS_PREFS: FocusPrefs = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longEvery: 4,
  autoStartNext: false,
  sound: true,
  notify: false,
};

export function phaseSeconds(phase: Phase, prefs: FocusPrefs): number {
  const min = phase === "focus" ? prefs.focusMin : phase === "short" ? prefs.shortBreakMin : prefs.longBreakMin;
  return min * 60;
}

/** The phase that follows `phase`, given how many focus sessions are now done. */
export function phaseAfter(phase: Phase, focusDone: number, prefs: FocusPrefs): Phase {
  if (phase !== "focus") return "focus";
  return focusDone % prefs.longEvery === 0 ? "long" : "short";
}

export function secondsLeft(startedAt: number, now: number, total: number): number {
  return Math.max(0, Math.ceil(total - (now - startedAt) / 1000));
}

const clampInt = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Stored prefs come back from localStorage untyped; keep what's valid, default the rest. */
export function normalizeFocusPrefs(raw: Partial<FocusPrefs> | null | undefined): FocusPrefs {
  const r = (raw ?? {}) as Record<string, unknown>;
  const d = DEFAULT_FOCUS_PREFS;
  return {
    focusMin: clampInt(r.focusMin, 1, 180, d.focusMin),
    shortBreakMin: clampInt(r.shortBreakMin, 1, 180, d.shortBreakMin),
    longBreakMin: clampInt(r.longBreakMin, 1, 180, d.longBreakMin),
    longEvery: clampInt(r.longEvery, 1, 12, d.longEvery),
    autoStartNext: bool(r.autoStartNext, d.autoStartNext),
    sound: bool(r.sound, d.sound),
    notify: bool(r.notify, d.notify),
  };
}
