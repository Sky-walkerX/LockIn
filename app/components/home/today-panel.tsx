"use client";

import { useTodayTasks } from "@/hooks/useTasks";
import { format, isBefore, startOfDay } from "date-fns";

const FALLBACK = "#8b8f9e";

export function TodayPanel() {
  const { data, isLoading } = useTodayTasks();
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
        {overdue > 0 && (
          <span className="lk-pill" style={{ color: "var(--destructive)" }}>
            {overdue} overdue
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="lk-mono mt-4 text-xs opacity-60">loading…</div>
      ) : list.length === 0 ? (
        <div className="lk-mono mt-4 text-xs opacity-70">Nothing due today. Nice. ✦</div>
      ) : (
        <div className="lk-rows mt-4 flex flex-col gap-0.5">
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
