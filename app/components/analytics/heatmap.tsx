"use client";

import { format, parseISO, getDay } from "date-fns";
import { useActivityHeatmap, type HeatmapDay } from "@/hooks/use-activity-heatmap";

// Maps a completion count to one of 5 intensity buckets.
function level(count: number) {
  if (count === 0) return 0;
  if (count >= 6) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  return 1;
}

// Background per intensity — accent mixed toward the card colour.
const LEVEL_BG = [
  "var(--lk-bar-track)",
  "color-mix(in srgb, var(--accent) 28%, var(--card))",
  "color-mix(in srgb, var(--accent) 50%, var(--card))",
  "color-mix(in srgb, var(--accent) 74%, var(--card))",
  "var(--accent)",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityHeatmap({ days = 365 }: { days?: number }) {
  const { data = [], isLoading } = useActivityHeatmap(days);

  // Build week columns (Sun→Sat), padding the first week with leading blanks.
  const cells: (HeatmapDay | null)[] = [];
  if (data.length) {
    const lead = getDay(parseISO(data[0].date));
    for (let i = 0; i < lead; i++) cells.push(null);
  }
  cells.push(...data);
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const totalCompleted = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="lk-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="lk-sec">activity · last year</div>
        <div className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {totalCompleted} done · {activeDays} active days
        </div>
      </div>

      {isLoading ? (
        <div className="lk-mono text-xs text-muted-foreground">loading…</div>
      ) : (
        <div className="overflow-x-auto pb-1">
          {/* Month labels */}
          <div className="flex gap-[3px] pl-0.5">
            {weeks.map((week, wi) => {
              const first = week.find((d) => d);
              const month = first ? parseISO(first.date).getMonth() : -1;
              const prevFirst = wi > 0 ? weeks[wi - 1].find((d) => d) : null;
              const prevMonth = prevFirst ? parseISO(prevFirst.date).getMonth() : -1;
              const show = month !== -1 && month !== prevMonth;
              return (
                <div key={wi} className="lk-mono w-[11px] text-[8px] text-muted-foreground">
                  {show ? MONTHS[month] : ""}
                </div>
              );
            })}
          </div>

          {/* Cells */}
          <div className="mt-1 flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, di) => {
                  const day = week[di] ?? null;
                  if (!day) return <div key={di} className="h-[11px] w-[11px]" />;
                  const lvl = level(day.count);
                  return (
                    <div
                      key={di}
                      className="h-[11px] w-[11px] rounded-[3px] transition-transform hover:scale-125"
                      style={{ background: LEVEL_BG[lvl] }}
                      title={`${format(parseISO(day.date), "EEE, MMM d yyyy")} — ${day.count} completed`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="lk-mono mt-3 flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-muted-foreground">
            <span>less</span>
            {LEVEL_BG.map((bg, i) => (
              <div key={i} className="h-[11px] w-[11px] rounded-[3px]" style={{ background: bg }} />
            ))}
            <span>more</span>
          </div>
        </div>
      )}
    </div>
  );
}
