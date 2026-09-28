import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { format, subDays } from "date-fns";

export interface HeatmapDay {
  date: string; // yyyy-MM-dd
  count: number; // tasks completed that day
}

// GitHub-style activity: tasks completed per day over the last `days`.
export function useActivityHeatmap(days = 365) {
  const { data: tasks = [], isLoading } = useTasks();

  const data = useMemo<HeatmapDay[]>(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (!t.isCompleted || !t.completedAt) continue;
      const key = format(new Date(t.completedAt), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = new Date();
    const out: HeatmapDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(today, i), "yyyy-MM-dd");
      out.push({ date: key, count: counts.get(key) ?? 0 });
    }
    return out;
  }, [tasks, days]);

  return { data, isLoading };
}
