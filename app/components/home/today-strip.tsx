"use client";

import Link from "next/link";
import { format, isBefore, startOfDay } from "date-fns";
import { useTodayTasks } from "@/hooks/useTasks";
import { useDueReviews } from "@/hooks/useReviews";
import { RateButtons } from "@/app/components/review/revision";

const FALLBACK = "var(--muted-foreground)";

// The Plan layer's one appearance on the home page, and only when something is
// due: tasks for today and notes up for revision. With nothing due it renders
// nothing at all.
export function TodayStrip() {
  const { data: tasks = [] } = useTodayTasks();
  const { data: reviews = [] } = useDueReviews();
  if (tasks.length === 0 && reviews.length === 0) return null;

  const startToday = startOfDay(new Date());
  return (
    <section id="today" aria-label="Due today" className="lk-hero scroll-mt-16 px-4 py-3">
      <div className="mb-1.5 flex items-baseline gap-3">
        <h2 className="lk-sec !text-foreground">Due today</h2>
        <span className="text-sm text-muted-foreground">
          {[
            tasks.length > 0 && `${tasks.length} task${tasks.length === 1 ? "" : "s"}`,
            reviews.length > 0 && `${reviews.length} to revise`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      <ul className="grid">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="lk-subject flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-1.5 first:border-t-0"
            style={{ "--c": r.subject.color ?? FALLBACK } as React.CSSProperties}
          >
            <span className="lk-swatch" />
            <Link href={`/subjects/${r.subject.id}?note=${r.id}`} className="min-w-0 flex-1 truncate font-reading text-base hover:underline">
              {r.title}
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">{r.subject.title}</span>
            <RateButtons milestoneId={r.id} />
          </li>
        ))}
        {tasks.map((t) => {
          const due = t.dueDate ? new Date(t.dueDate) : null;
          const overdue = due ? isBefore(due, startToday) : false;
          return (
            <li
              key={t.id}
              className="lk-subject flex items-center gap-3 border-t border-border py-1.5 first:border-t-0"
              style={{ "--c": t.subject.color ?? FALLBACK } as React.CSSProperties}
            >
              <span className="lk-swatch" />
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className="hidden text-sm text-muted-foreground sm:inline">{t.subject.title}</span>
              <span className={`lk-print text-xs uppercase ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                {overdue ? "Overdue" : due ? format(due, "HH:mm") : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
