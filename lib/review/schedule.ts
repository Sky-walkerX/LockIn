// Topic-level spaced repetition for milestones. Deliberately simpler than an
// Anki-style card scheduler: a milestone is a whole topic you revise from its
// notes, so three honest ratings and a stretching interval are enough.
//
// Shared by the review API and the optimistic client update, so both agree on
// the next date without a refetch.

export const REVIEW_RATINGS = ["FORGOT", "SHAKY", "SOLID"] as const;
export type ReviewRating = (typeof REVIEW_RATINGS)[number];
export type Confidence = "WEAK" | "OK" | "STRONG";

export const MAX_INTERVAL_DAYS = 120;

const DAY_MS = 86_400_000;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

const CONFIDENCE: Record<ReviewRating, Confidence> = { FORGOT: "WEAK", SHAKY: "OK", SOLID: "STRONG" };

/** Finishing a milestone schedules its first revision for the next day. */
export function firstReview(now: Date): { reviewDueAt: Date; reviewInterval: number } {
  return { reviewDueAt: addDays(now, 1), reviewInterval: 1 };
}

export function nextReview(
  state: { reviewInterval: number | null; reviewCount: number },
  rating: ReviewRating,
  now: Date,
): {
  reviewDueAt: Date;
  reviewInterval: number;
  reviewCount: number;
  lastReviewedAt: Date;
  confidence: Confidence;
} {
  const prev = state.reviewInterval ?? 1;
  const interval =
    rating === "FORGOT"
      ? 1
      : rating === "SHAKY"
        ? Math.max(1, Math.round(prev * 1.2))
        : Math.min(MAX_INTERVAL_DAYS, Math.max(prev + 1, Math.round(prev * 2.5)));

  return {
    reviewDueAt: addDays(now, interval),
    reviewInterval: interval,
    reviewCount: state.reviewCount + 1,
    lastReviewedAt: now,
    confidence: CONFIDENCE[rating],
  };
}
