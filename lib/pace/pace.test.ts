import { describe, expect, it } from "vitest";
import { computeCoverage, computePace, subjectPace } from "./pace";

const m = (weight: number, isCompleted: boolean, doneTasks = 0, totalTasks = 0) => ({
  weight,
  isCompleted,
  doneTasks,
  totalTasks,
});

describe("computeCoverage", () => {
  it("weights each milestone by its share of the syllabus", () => {
    // 7.8 done out of 7.8 + 10.8 + 4.2 = 22.8
    expect(computeCoverage([m(7.8, true), m(10.8, false), m(4.2, false)])).toBeCloseTo(7.8 / 22.8);
  });

  it("gives an unfinished milestone partial credit for its done tasks", () => {
    expect(computeCoverage([m(1, false, 1, 4), m(1, false)])).toBeCloseTo(0.125);
  });

  it("counts a completed milestone in full whatever its tasks say", () => {
    expect(computeCoverage([m(1, true, 0, 5)])).toBe(1);
  });

  it("falls back to task progress when there are no milestones", () => {
    expect(computeCoverage([], { done: 3, total: 4 })).toBe(0.75);
    expect(computeCoverage([], { done: 0, total: 0 })).toBe(0);
  });

  it("ignores milestones weighted zero or less", () => {
    expect(computeCoverage([m(0, false), m(2, true)])).toBe(1);
  });
});

describe("computePace", () => {
  const start = new Date("2026-09-01T00:00:00Z");
  const target = new Date("2026-11-30T00:00:00Z"); // 90 days
  const at = (day: number) => new Date(start.getTime() + day * 86_400_000);

  it("has nothing to say without a target date", () => {
    expect(computePace({ start, target: null, now: at(10), coverage: 0.2 }).status).toBe("none");
  });

  it("is on pace within five points of the elapsed share", () => {
    const p = computePace({ start, target, now: at(45), coverage: 0.53 });
    expect(p.elapsed).toBeCloseTo(0.5);
    expect(p.status).toBe("on-pace");
    expect(p.daysLeft).toBe(45);
  });

  it("is behind or ahead outside that band", () => {
    expect(computePace({ start, target, now: at(45), coverage: 0.3 }).status).toBe("behind");
    expect(computePace({ start, target, now: at(45), coverage: 0.7 }).status).toBe("ahead");
  });

  it("is overdue once the date passes unfinished, and done once covered", () => {
    expect(computePace({ start, target, now: at(91), coverage: 0.9 }).status).toBe("overdue");
    expect(computePace({ start, target, now: at(91), coverage: 1 }).status).toBe("done");
    expect(computePace({ start, target, now: at(91), coverage: 0.9 }).daysLeft).toBe(0);
  });

  // Targets are stored as the end of the chosen day, so the evening before an
  // exam is "1d left", not 2.
  it("counts whole days left to an end-of-day target", () => {
    const now = new Date("2026-09-23T20:00:00Z");
    const endOfTomorrow = new Date("2026-09-24T23:59:59.999Z");
    const endOfToday = new Date("2026-09-23T23:59:59.999Z");
    expect(computePace({ start, target: endOfTomorrow, now, coverage: 0 }).daysLeft).toBe(1);
    expect(computePace({ start, target: endOfToday, now, coverage: 0 }).daysLeft).toBe(0);
  });

  it("works out the share still needed per week", () => {
    // 60% left over 45 days (6 3/7 weeks)
    const p = computePace({ start, target, now: at(45), coverage: 0.4 });
    expect(p.neededPerWeek).toBeCloseTo(0.6 / (45 / 7));
  });

  it("clamps elapsed when the start is after now or the dates are reversed", () => {
    expect(computePace({ start: at(10), target, now: at(0), coverage: 0 }).elapsed).toBe(0);
    expect(computePace({ start: target, target: start, now: at(0), coverage: 0 }).elapsed).toBe(1);
  });
});

describe("subjectPace", () => {
  const now = new Date("2026-10-01T00:00:00Z");

  it("measures from the start date when one is set", () => {
    const p = subjectPace(
      { createdAt: "2026-01-01T00:00:00Z", startDate: "2026-09-01T00:00:00Z", targetDate: "2026-10-31T00:00:00Z" },
      0.5,
      now,
    );
    expect(p.elapsed).toBeCloseTo(0.5);
  });

  it("falls back to when the subject was created", () => {
    const p = subjectPace(
      { createdAt: "2026-09-01T00:00:00Z", startDate: null, targetDate: "2026-10-31T00:00:00Z" },
      0.5,
      now,
    );
    expect(p.elapsed).toBeCloseTo(0.5);
  });

  it("reports no pace without a target", () => {
    expect(subjectPace({ createdAt: now, startDate: null, targetDate: null }, 0.2, now).status).toBe("none");
  });
});
