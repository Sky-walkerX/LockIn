import prisma from "@/lib/prisma";
import type { Priority } from "@/app/generated/prisma";

const XP_BY_PRIORITY: Record<Priority, number> = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 20,
};

const XP_EARLY_COMPLETION = 5;
const XP_AI_SUGGESTED = 10;
const XP_PER_LEVEL = 100;

export function calculateTaskXP(
  priority: Priority,
  isAiSuggested: boolean,
  dueDate: Date | null,
  completedAt: Date,
): number {
  let xp = XP_BY_PRIORITY[priority] ?? 10;

  if (dueDate && completedAt < dueDate) {
    xp += XP_EARLY_COMPLETION;
  }

  if (isAiSuggested) {
    xp += XP_AI_SUGGESTED;
  }

  return xp;
}

export function levelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Awards XP to the user for completing a task.
 * Updates streak if the user hasn't been active today.
 */
export async function awardTaskCompletionXP(
  userId: string,
  priority: Priority,
  isAiSuggested: boolean,
  dueDate: Date | null,
) {
  const now = new Date();
  const xpGained = calculateTaskXP(priority, isAiSuggested, dueDate, now);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, streak: true, lastActiveDate: true },
  });

  if (!user) return;

  const todayStr = now.toISOString().slice(0, 10);
  const lastActiveStr = user.lastActiveDate
    ? user.lastActiveDate.toISOString().slice(0, 10)
    : null;

  let newStreak = user.streak;

  if (lastActiveStr !== todayStr) {
    // Check if yesterday was active (streak continues) or not (streak resets)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastActiveStr === yesterdayStr) {
      newStreak = user.streak + 1;
    } else if (lastActiveStr !== todayStr) {
      newStreak = 1; // Reset streak
    }
  }

  // Streak bonus
  let streakBonus = 0;
  if (newStreak >= 10) streakBonus = 10;
  else if (newStreak >= 5) streakBonus = 5;
  else if (newStreak >= 1) streakBonus = Math.min(newStreak, 2);

  const totalXP = user.xp + xpGained + streakBonus;
  const newLevel = levelFromXP(totalXP);

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: totalXP,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: now,
    },
  });

  return { xpGained, streakBonus, totalXP, newLevel, newStreak };
}
