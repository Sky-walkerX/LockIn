"use client";

import Link from "next/link";
import { useTodayTasks } from "@/hooks/useTasks";
import { useDueReviews } from "@/hooks/useReviews";
import { RateButtons } from "@/app/components/review/revision";
import { format, isBefore, startOfDay } from "date-fns";

const FALLBACK = "#8b8f9e";

export function TodayPanel() {
  const { data, isLoading } = useTodayTasks();
  const { data: reviews = [] } = useDueReviews();
  const list = data ?? [];
  const startToday = startOfDay(new Date());
  const overdue = list.filter((t) => t.dueDate && isBefore(new Date(t.dueDate), startToday)).length;

  return (
    <section className="lk-hero p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="lk-mono text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">Today</div>
          <div className="lk-mono mt-1 text-5xl font-bold leading-none">{list.length}</div>
          <div className="lk-mono mt-1 text-[11px] uppercase tracking-wider opacity-70">tasks due</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {reviews.length > 0 && <span className="lk-pill">{reviews.length} to revise</span>}
          {overdue > 0 && (
            <span className="lk-pill" style={{ color: "var(--destructive)" }}>
              {overdue} overdue
            </span>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-4">
          <div className="lk-mono mb-1 text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">Revise</div>
          <div className="lk-rows flex flex-col gap-0.5">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="lk-row lk-subject flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5"
                style={{ "--c": r.subject.color ?? FALLBACK } as React.CSSProperties}
              >
                <span className="lk-swatch" />
                <Link
                  href={`/subjects/${r.subject.id}?open=milestone:${r.id}`}
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                  title="Open the topic and its notes"
                >
                  {r.title}
                </Link>
                <span className="lk-mono hidden text-[11px] text-muted-foreground sm:inline">{r.subject.title}</span>
                <span className="lk-mono hidden text-[10px] uppercase text-muted-foreground md:inline">
                  {r.reviewCount === 0 ? "first review" : `review ${r.reviewCount + 1} · every ${r.reviewInterval}d`}
                </span>
                <RateButtons milestoneId={r.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="lk-mono mt-4 text-xs opacity-60">loading…</div>
      ) : list.length === 0 ? (
        <div className="lk-mono mt-4 text-xs opacity-70">
          {reviews.length > 0 ? "No tasks due today." : "Nothing due today. Nice. ✦"}
        </div>
      ) : (
        <div className="lk-rows mt-4 flex flex-col gap-0.5">
          {reviews.length > 0 && (
            <div className="lk-mono mb-1 text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">Tasks</div>
          )}
          {list.map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : null;
            const isOverdue = due ? isBefore(due, startToday) : false;
            return (
              <div
                key={t.id}
                className="lk-row lk-subject flex items-center gap-3 py-1.5"
                style={{ "--c": t.subject.color ?? FALLBACK } as React.CSSProperties}
              >
                <span className="lk-swatch" />
                <span className="flex-1 truncate text-sm">{t.title}</span>
                <span className="lk-mono hidden text-[11px] text-muted-foreground sm:inline">{t.subject.title}</span>
                <span className={`lk-mono text-[10px] uppercase ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                  {isOverdue ? "overdue" : due ? format(due, "HH:mm") : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
