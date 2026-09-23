"use client";

import { differenceInCalendarDays, endOfDay } from "date-fns";
import type { Confidence } from "@/app/generated/prisma";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { useUpdateMilestone } from "@/hooks/useMilestones";
import { useReviewMilestone } from "@/hooks/useReviews";
import { firstReview, type ReviewRating } from "@/lib/review/schedule";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export const CONFIDENCE_META: Record<Confidence, { label: string; color: string }> = {
  WEAK: { label: "weak", color: "var(--destructive)" },
  OK: { label: "ok", color: "var(--lk-warn)" },
  STRONG: { label: "strong", color: "var(--lk-ok)" },
};

const RATINGS: { rating: ReviewRating; label: string; hint: string }[] = [
  { rating: "FORGOT", label: "Forgot", hint: "Start over tomorrow" },
  { rating: "SHAKY", label: "Shaky", hint: "Come back a little later" },
  { rating: "SOLID", label: "Solid", hint: "Push it well out" },
];

/** A review is due once its date falls on or before the end of today, local time. */
export function isReviewDue(reviewDueAt: Date | string | null): boolean {
  return reviewDueAt !== null && new Date(reviewDueAt) <= endOfDay(new Date());
}

export function RateButtons({ milestoneId }: { milestoneId: string }) {
  const review = useReviewMilestone();
  return (
    <div className="flex items-center gap-1" role="group" aria-label="How well did it stick?">
      {RATINGS.map(({ rating, label, hint }) => (
        <button
          key={rating}
          type="button"
          title={hint}
          disabled={review.isPending}
          onClick={() => review.mutate({ id: milestoneId, rating })}
          className="lk-mono rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * The confidence tag on a milestone, and the menu behind it: set how well the
 * topic has stuck, and start or stop revising it. Unrated milestones show the
 * tag only on hover, so a fresh plan stays quiet.
 */
export function ConfidenceMenu({ milestone }: { milestone: MilestoneWithTasks }) {
  const update = useUpdateMilestone();
  const meta = milestone.confidence ? CONFIDENCE_META[milestone.confidence] : null;
  const set = (data: Parameters<typeof update.mutate>[0]["data"]) => update.mutate({ id: milestone.id, data });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Confidence and revision"
        className={`lk-tag flex-none transition-opacity ${meta ? "" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
        style={meta ? { color: meta.color, borderColor: meta.color } : undefined}
      >
        {meta ? meta.label : "rate"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          How well do you know it?
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={milestone.confidence ?? ""}
          onValueChange={(v) => set({ confidence: v as Confidence })}
        >
          {(Object.keys(CONFIDENCE_META) as Confidence[]).map((c) => (
            <DropdownMenuRadioItem key={c} value={c}>
              <span className="capitalize" style={{ color: CONFIDENCE_META[c].color }}>
                {CONFIDENCE_META[c].label}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {meta && <DropdownMenuItem onSelect={() => set({ confidence: null })}>Clear</DropdownMenuItem>}
        {milestone.isCompleted && <DropdownMenuSeparator />}
        {milestone.isCompleted &&
          (milestone.reviewDueAt ? (
            <DropdownMenuItem onSelect={() => set({ reviewDueAt: null, reviewInterval: null })}>
              Stop revising
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => {
                const first = firstReview(new Date());
                set({ reviewDueAt: first.reviewDueAt.toISOString(), reviewInterval: first.reviewInterval });
              }}
            >
              Revise again from tomorrow
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Rating buttons when a review is due, otherwise when the next one comes up. */
export function ReviewStatus({ milestone }: { milestone: MilestoneWithTasks }) {
  if (!milestone.isCompleted || !milestone.reviewDueAt) return null;
  if (isReviewDue(milestone.reviewDueAt)) return <RateButtons milestoneId={milestone.id} />;
  const days = differenceInCalendarDays(new Date(milestone.reviewDueAt), new Date());
  return (
    <span
      className="lk-mono hidden flex-none text-[10px] uppercase tracking-wide text-muted-foreground sm:inline"
      title={`Revised ${milestone.reviewCount} time${milestone.reviewCount === 1 ? "" : "s"}`}
    >
      review in {days}d
    </span>
  );
}
