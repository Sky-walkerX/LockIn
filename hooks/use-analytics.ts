import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { format, isToday, subDays, startOfWeek, addDays } from "date-fns";

// Study-progress stats derived from the user's tasks (no gamification/XP).
export interface StudyStats {
  totalCompleted: number;
  completedToday: number;
  currentStreak: number; // consecutive days (ending today) with ≥1 completion
  longestStreak: number; // best run within the last 30 days
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

    // Completion count per day for the last 30 days (index 0 = today).
    const today = new Date();
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const key = dayKey(subDays(today, i));
      return completed.filter((t) => t.completedAt && dayKey(t.completedAt) === key).length;
    });

    let currentStreak = 0;
    for (const c of last30) {
      if (c > 0) currentStreak++;
      else break;
    }

    let longestStreak = 0;
    let run = 0;
    for (const c of last30) {
      if (c > 0) {
        run++;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
    }

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
