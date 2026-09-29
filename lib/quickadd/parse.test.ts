import { describe, expect, it } from "vitest";
import { parseQuickAdd, type QuickAddSubject } from "./parse";

const subjects: QuickAddSubject[] = [
  {
    id: "os",
    title: "Operating Systems",
    milestones: [
      { id: "mem", title: "Memory management" },
      { id: "sched", title: "CPU Scheduling" },
    ],
  },
  { id: "dsa", title: "Data Structures", milestones: [] },
  { id: "gate", title: "GATE Prep", milestones: [] },
];

// Wednesday 23 Sep 2026, mid-afternoon local time.
const now = new Date(2026, 8, 23, 15, 30);
const parse = (input: string, defaultSubjectId: string | null = null) =>
  parseQuickAdd(input, { now, subjects, defaultSubjectId });
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe("parseQuickAdd", () => {
  it("parses the whole grammar and leaves the rest as the title", () => {
    const p = parse("revise paging fri 2h !h #os @mem");
    expect(p).toEqual({
      title: "revise paging",
      subjectId: "os",
      subjectQuery: "os",
      milestoneId: "mem",
      milestoneQuery: "mem",
      priority: "HIGH",
      dueDate: day(2026, 9, 25),
      estimatedTime: 120,
      recurrence: null,
    });
  });

  it("matches subjects by initials, word prefix or a quoted name", () => {
    expect(parse("x #os").subjectId).toBe("os");
    expect(parse("x #data").subjectId).toBe("dsa");
    expect(parse("x #struct").subjectId).toBe("dsa");
    expect(parse('x #"gate prep"').subjectId).toBe("gate");
    expect(parse("x #chem").subjectId).toBeNull();
    expect(parse("x #chem").subjectQuery).toBe("chem");
  });

  it("falls back to the current subject, and only looks for milestones inside it", () => {
    expect(parse("x @sched", "os").milestoneId).toBe("sched");
    expect(parse("x @sched", "dsa").milestoneId).toBeNull();
    expect(parse("x @sched", "dsa").milestoneQuery).toBe("sched");
    expect(parse("x").subjectId).toBeNull();
  });

  it("reads priorities", () => {
    expect(parse("x !high").priority).toBe("HIGH");
    expect(parse("x !m").priority).toBe("MEDIUM");
    expect(parse("x !low").priority).toBe("LOW");
    expect(parse("x !3").priority).toBe("LOW");
    expect(parse("x").priority).toBeNull();
  });

  describe("dates", () => {
    it("today and tomorrow", () => {
      expect(parse("x today").dueDate).toEqual(day(2026, 9, 23));
      expect(parse("x tod").dueDate).toEqual(day(2026, 9, 23));
      expect(parse("x tomorrow").dueDate).toEqual(day(2026, 9, 24));
      expect(parse("x tmr").dueDate).toEqual(day(2026, 9, 24));
    });

    it("a weekday is its next occurrence, never today", () => {
      expect(parse("x fri").dueDate).toEqual(day(2026, 9, 25));
      expect(parse("x monday").dueDate).toEqual(day(2026, 9, 28));
      expect(parse("x wed").dueDate).toEqual(day(2026, 9, 30));
    });

    it("next week, and in N days or weeks", () => {
      expect(parse("x next week").dueDate).toEqual(day(2026, 9, 28));
      expect(parse("x in 3d").dueDate).toEqual(day(2026, 9, 26));
      expect(parse("x in 2 weeks").dueDate).toEqual(day(2026, 10, 7));
    });

    it("day and month either way round, rolling into next year once past", () => {
      expect(parse("x 12 oct").dueDate).toEqual(day(2026, 10, 12));
      expect(parse("x oct 12").dueDate).toEqual(day(2026, 10, 12));
      expect(parse("x 3 january").dueDate).toEqual(day(2027, 1, 3));
    });

    it("leaves numbers that aren't dates in the title", () => {
      const p = parse("solve 12 problems");
      expect(p.title).toBe("solve 12 problems");
      expect(p.dueDate).toBeNull();
    });
  });

  it("reads estimates", () => {
    expect(parse("x 45m").estimatedTime).toBe(45);
    expect(parse("x 1h30m").estimatedTime).toBe(90);
    expect(parse("x 1.5h").estimatedTime).toBe(90);
  });

  it("reads recurrence", () => {
    expect(parse("x daily").recurrence).toBe("DAILY");
    expect(parse("x every week").recurrence).toBe("WEEKLY");
    expect(parse("x monthly").recurrence).toBe("MONTHLY");
  });

  it("keeps the words' order and case in the title", () => {
    expect(parse("Read  OSTEP ch. 19 tomorrow").title).toBe("Read OSTEP ch. 19");
  });

  it("uses only the first of repeated markers and keeps the rest as words", () => {
    const p = parse("x !h !l");
    expect(p.priority).toBe("HIGH");
    expect(p.title).toBe("x !l");
  });

  // The lookup tables must not see Object.prototype's keys as markers.
  it("treats words like constructor or toString as plain words", () => {
    const p = parse("study constructor chaining toString !constructor every constructor");
    expect(p.title).toBe("study constructor chaining toString !constructor every constructor");
    expect(p.dueDate).toBeNull();
    expect(p.priority).toBeNull();
    expect(p.recurrence).toBeNull();
  });
});
