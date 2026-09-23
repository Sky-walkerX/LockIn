import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streak";

describe("computeStreaks", () => {
  it("is zero with no completions", () => {
    expect(computeStreaks([], "2026-09-23")).toEqual({ current: 0, longest: 0 });
  });

  it("counts a run that ends today", () => {
    const days = ["2026-09-21", "2026-09-22", "2026-09-23"];
    expect(computeStreaks(days, "2026-09-23")).toEqual({ current: 3, longest: 3 });
  });

  // Before the first completion of the day the run is still alive, not zero:
  // it only breaks once a whole day passes with nothing done.
  it("keeps a run that ended yesterday alive through today", () => {
    const days = ["2026-09-20", "2026-09-21", "2026-09-22"];
    expect(computeStreaks(days, "2026-09-23").current).toBe(3);
  });

  it("breaks the run after a full missed day", () => {
    const days = ["2026-09-20", "2026-09-21"];
    expect(computeStreaks(days, "2026-09-23").current).toBe(0);
  });

  it("finds the longest run across all time, not just the last 30 days", () => {
    const old = ["2025-01-01", "2025-01-02", "2025-01-03", "2025-01-04", "2025-01-05"];
    const recent = ["2026-09-22", "2026-09-23"];
    expect(computeStreaks([...recent, ...old], "2026-09-23")).toEqual({ current: 2, longest: 5 });
  });

  it("ignores duplicate days and input order", () => {
    const days = ["2026-09-23", "2026-09-22", "2026-09-23", "2026-09-22"];
    expect(computeStreaks(days, "2026-09-23")).toEqual({ current: 2, longest: 2 });
  });

  it("runs across month and year boundaries", () => {
    const days = ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"];
    expect(computeStreaks(days, "2026-01-02")).toEqual({ current: 4, longest: 4 });
  });

  it("runs across a leap day", () => {
    const days = ["2028-02-28", "2028-02-29", "2028-03-01"];
    expect(computeStreaks(days, "2028-03-01").longest).toBe(3);
  });
});
