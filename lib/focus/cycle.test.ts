import { describe, expect, it } from "vitest";
import { DEFAULT_FOCUS_PREFS, normalizeFocusPrefs, phaseAfter, phaseSeconds, secondsLeft } from "./cycle";

const prefs = { ...DEFAULT_FOCUS_PREFS, focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longEvery: 4 };

describe("phaseSeconds", () => {
  it("reads each phase's length from the prefs", () => {
    expect(phaseSeconds("focus", prefs)).toBe(1500);
    expect(phaseSeconds("short", prefs)).toBe(300);
    expect(phaseSeconds("long", prefs)).toBe(900);
  });
});

describe("phaseAfter", () => {
  it("takes a short break after focus, a long one every fourth", () => {
    const seq = [1, 2, 3, 4, 5].map((done) => phaseAfter("focus", done, prefs));
    expect(seq).toEqual(["short", "short", "short", "long", "short"]);
  });

  it("goes back to focus after any break", () => {
    expect(phaseAfter("short", 1, prefs)).toBe("focus");
    expect(phaseAfter("long", 4, prefs)).toBe("focus");
  });
});

describe("secondsLeft", () => {
  it("counts down from the phase start, never below zero", () => {
    expect(secondsLeft(0, 60_500, 1500)).toBe(1440);
    expect(secondsLeft(0, 2_000_000, 1500)).toBe(0);
  });

  it("rounds a part-second up so the clock doesn't hit 0 early", () => {
    expect(secondsLeft(0, 1_499_100, 1500)).toBe(1);
  });
});

describe("normalizeFocusPrefs", () => {
  it("fills gaps from the defaults", () => {
    expect(normalizeFocusPrefs({ focusMin: 50 })).toEqual({ ...DEFAULT_FOCUS_PREFS, focusMin: 50 });
  });

  it("clamps lengths to whole minutes in a sane range", () => {
    const p = normalizeFocusPrefs({ focusMin: 0, shortBreakMin: 999, longBreakMin: 7.6, longEvery: -2 });
    expect(p.focusMin).toBe(1);
    expect(p.shortBreakMin).toBe(180);
    expect(p.longBreakMin).toBe(8);
    expect(p.longEvery).toBe(1);
  });

  it("ignores junk", () => {
    expect(normalizeFocusPrefs({ focusMin: "x", sound: "yes" } as never)).toEqual(DEFAULT_FOCUS_PREFS);
    expect(normalizeFocusPrefs(null)).toEqual(DEFAULT_FOCUS_PREFS);
  });
});
