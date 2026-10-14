import { describe, expect, it, vi } from "vitest";

// The pure parts; the writes are driven against a database in the verify skill.
vi.mock("@/lib/prisma", () => ({ default: {} }));
const { CAPTURE_LIMIT, captureSection, captureTitle, folderName } = await import("./capture");

const at = new Date("2026-10-14T16:40:00Z");

describe("captureSection", () => {
  it("dates each compaction and says how it came", () => {
    expect(captureSection("  Wired OAuth refresh.  ", "auto", at)).toBe("## 2026-10-14 16:40 UTC, compacted automatically\n\nWired OAuth refresh.");
    expect(captureSection("x", "manual", at)).toContain("compacted with /compact");
  });

  it("cuts a very long summary short and says so", () => {
    const text = captureSection("a".repeat(CAPTURE_LIMIT + 50), "auto", at);
    expect(text.endsWith("…(cut short)")).toBe(true);
    expect(text.length).toBeLessThan(CAPTURE_LIMIT + 100);
  });
});

describe("captureTitle", () => {
  it("names the folder the session ran in", () => {
    expect(captureTitle("/Users/me/Coding/LockIn", at)).toBe("Session in LockIn, 14 Oct");
    expect(captureTitle(undefined, at)).toBe("Session, 14 Oct");
    expect(folderName("C:\\src\\app\\")).toBe("app");
  });
});
