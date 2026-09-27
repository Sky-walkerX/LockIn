import { describe, expect, it } from "vitest";
import { firstReview, nextReview, MAX_INTERVAL_DAYS } from "./schedule";

const now = new Date("2026-09-23T10:00:00Z");
const daysAfterNow = (d: Date) => (d.getTime() - now.getTime()) / 86_400_000;

describe("firstReview", () => {
  it("comes back the next day with a one-day interval", () => {
    const r = firstReview(now);
    expect(r.reviewInterval).toBe(1);
    expect(daysAfterNow(r.reviewDueAt)).toBe(1);
  });
});

describe("nextReview", () => {
  it("stretches the interval on SOLID: 1 → 3 → 8 → 20 → 50", () => {
    let state = { reviewInterval: 1, reviewCount: 0 };
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = nextReview(state, "SOLID", now);
      seen.push(r.reviewInterval);
      state = r;
    }
    expect(seen).toEqual([3, 8, 20, 50]);
  });

  it("caps the interval", () => {
    const r = nextReview({ reviewInterval: 100, reviewCount: 6 }, "SOLID", now);
    expect(r.reviewInterval).toBe(MAX_INTERVAL_DAYS);
  });

  it("grows the interval only a little on SHAKY, and never below a day", () => {
    expect(nextReview({ reviewInterval: 10, reviewCount: 3 }, "SHAKY", now).reviewInterval).toBe(12);
    expect(nextReview({ reviewInterval: 1, reviewCount: 1 }, "SHAKY", now).reviewInterval).toBe(1);
  });

  it("starts over from a day on FORGOT", () => {
    expect(nextReview({ reviewInterval: 50, reviewCount: 5 }, "FORGOT", now).reviewInterval).toBe(1);
  });

  it("sets the due date that many days out and stamps the review", () => {
    const r = nextReview({ reviewInterval: 3, reviewCount: 1 }, "SOLID", now);
    expect(daysAfterNow(r.reviewDueAt)).toBe(r.reviewInterval);
    expect(r.lastReviewedAt).toEqual(now);
    expect(r.reviewCount).toBe(2);
  });

  it("maps each rating onto a confidence level", () => {
    const s = { reviewInterval: 3, reviewCount: 1 };
    expect(nextReview(s, "FORGOT", now).confidence).toBe("WEAK");
    expect(nextReview(s, "SHAKY", now).confidence).toBe("OK");
    expect(nextReview(s, "SOLID", now).confidence).toBe("STRONG");
  });

  // A milestone whose schedule was cleared ("stop revising") can still be rated.
  it("treats a missing interval as a first review", () => {
    const r = nextReview({ reviewInterval: null, reviewCount: 0 }, "SOLID", now);
    expect(r.reviewInterval).toBe(3);
  });
});
