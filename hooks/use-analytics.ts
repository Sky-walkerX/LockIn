import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { format, isToday, startOfWeek, addDays } from "date-fns";
import { computeStreaks } from "@/lib/analytics/streak";

// Study-progress stats derived from the user's tasks (no gamification/XP).
export interface StudyStats {
  totalCompleted: number;
  completedToday: number;
  currentStreak: number; // consecutive days with ≥1 completion, ending today or yesterday
  longestStreak: number; // best run, all time
  totalFocusMinutes: number; // sum of Task.timeSpent
  activeTasks: number; // incomplete
  weeklyProgress: number[]; // completions per day, Sun…Sat of the current week
}

const dayKey = (d: Date | string) => format(new Date(d), "yyyy-MM-dd");

export function useAnalytics() {
  const { data: tasks = [], isLoading } = useTasks();

  const data = useMemo<StudyStats>(() => {
    const completed = tasks.filter((t) => t.isCompleted && t.completedAt);
    const totalCompleted = completed.length;
    const completedToday = completed.filter((t) => t.completedAt && isToday(new Date(t.completedAt))).length;
    const activeTasks = tasks.filter((t) => !t.isCompleted).length;
    const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0);

    const today = new Date();
    const { current: currentStreak, longest: longestStreak } = computeStreaks(
      completed.map((t) => dayKey(t.completedAt!)),
      dayKey(today),
    );

    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
      const key = dayKey(addDays(weekStart, i));
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
  }, [tasks]);

  return { data, isLoading };
}
