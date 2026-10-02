import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { format, subDays } from "date-fns";
import { useClock } from "@/app/components/clock";

export interface HeatmapDay {
  date: string; // yyyy-MM-dd
  count: number; // tasks completed that day
}

// GitHub-style activity: tasks completed per day over the last `days`.
export function useActivityHeatmap(days = 365) {
  const { data: tasks = [], isLoading } = useTasks();
  const clock = useClock();

  const data = useMemo<HeatmapDay[]>(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (!t.isCompleted || !t.completedAt) continue;
      const key = format(new Date(t.completedAt), "yyyy-MM-dd", { in: clock.in });
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // The user's days, in their zone (the clock), not the server's.
    const out: HeatmapDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(clock.now, i, { in: clock.in }), "yyyy-MM-dd", { in: clock.in });
      out.push({ date: key, count: counts.get(key) ?? 0 });
    }
    return out;
  }, [tasks, days, clock]);

  return { data, isLoading };
}
