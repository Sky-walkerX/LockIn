import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { format, startOfWeek, addDays } from "date-fns";
import { computeStreaks } from "@/lib/analytics/streak";
import { useClock } from "@/app/components/clock";

// Progress stats derived from the user's tasks (no gamification/XP).
export interface ProgressStats {
  totalCompleted: number;
  completedToday: number;
  currentStreak: number; // consecutive days with ≥1 completion, ending today or yesterday
  longestStreak: number; // best run, all time
  totalFocusMinutes: number; // sum of Task.timeSpent
  activeTasks: number; // incomplete
  weeklyProgress: number[]; // completions per day, Sun…Sat of the current week
}

export function useAnalytics() {
  const { data: tasks = [], isLoading } = useTasks();
  const clock = useClock();

  const data = useMemo<ProgressStats>(() => {
    // Days are the user's, in their zone (the clock), not the server's.
    const dayKey = (d: Date | string | number) => format(new Date(d), "yyyy-MM-dd", { in: clock.in });
    const todayKey = dayKey(clock.now);
    const completed = tasks.filter((t) => t.isCompleted && t.completedAt);
    const totalCompleted = completed.length;
    const completedToday = completed.filter((t) => t.completedAt && dayKey(t.completedAt) === todayKey).length;
    const activeTasks = tasks.filter((t) => !t.isCompleted).length;
    const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);

    const { current: currentStreak, longest: longestStreak } = computeStreaks(
      completed.map((t) => dayKey(t.completedAt!)),
      todayKey,
    );

    const weekStart = startOfWeek(clock.now, { weekStartsOn: 0, in: clock.in });
    const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
      const key = dayKey(addDays(weekStart, i, { in: clock.in }));
      return completed.filter((t) => t.completedAt && dayKey(t.completedAt) === key).length;
    });

    return {
      totalCompleted,
      completedToday,
      currentStreak,
      longestStreak,
      totalFocusMinutes,
      activeTasks,
      weeklyProgress,
    };
  }, [tasks, clock]);

  return { data, isLoading };
}
