import { describe, expect, it } from "vitest";
import { appendNote } from "./append";

const now = new Date(2026, 8, 23, 14, 0); // local 23 Sep 2026

describe("appendNote", () => {
  it("adds a stamped block under what's already there", () => {
    expect(appendNote("My notes", "Answer", "from chat", now)).toBe(
      "My notes\n\n---\n*from chat · 2026-09-23*\n\nAnswer",
    );
  });

  it("starts the note when it's empty", () => {
    expect(appendNote("  ", " Did the TLB exercises ", "from focus", now)).toBe(
      "---\n*from focus · 2026-09-23*\n\nDid the TLB exercises",
    );
  });

  it("stamps the local date, not UTC", () => {
    const lateNight = new Date(2026, 8, 23, 23, 59);
    expect(appendNote("", "x", "from chat", lateNight)).toContain("2026-09-23");
  });
});
