import { describe, expect, it } from "vitest";
import { todayIn } from "./zone";

describe("todayIn", () => {
  it("gives India's date and its end of day in UTC", () => {
    // 20:00 UTC is 01:30 the next day in India (+05:30).
    const r = todayIn("Asia/Kolkata", new Date("2026-10-02T20:00:00Z"));
    expect(r?.day).toBe("2026-10-03");
    expect(r?.endOfDay.toISOString()).toBe("2026-10-03T18:29:59.999Z");
  });

  it("follows a zone west of UTC", () => {
    // 02:00 UTC is still the previous evening in New York (EDT, -04:00).
    const r = todayIn("America/New_York", new Date("2026-07-15T02:00:00Z"));
    expect(r?.day).toBe("2026-07-14");
    expect(r?.endOfDay.toISOString()).toBe("2026-07-15T03:59:59.999Z");
  });

  it("uses the offset in force at the end of a day that changes it", () => {
    // 1 Nov 2026: New York falls back from EDT to EST at 02:00, so the day ends at -05:00.
    const r = todayIn("America/New_York", new Date("2026-11-01T12:00:00Z"));
    expect(r?.day).toBe("2026-11-01");
    expect(r?.endOfDay.toISOString()).toBe("2026-11-02T04:59:59.999Z");
  });

  it("handles UTC", () => {
    const r = todayIn("UTC", new Date("2026-10-03T00:00:00Z"));
    expect(r).toEqual({ day: "2026-10-03", endOfDay: new Date("2026-10-03T23:59:59.999Z") });
  });

  it("returns null for a zone it doesn't know", () => {
    expect(todayIn("Not/AZone")).toBeNull();
  });
});
