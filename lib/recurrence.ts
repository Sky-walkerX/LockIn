import type { Recurrence } from "@/app/generated/prisma";

/**
 * Given a recurrence type and a reference date, returns the next due date.
 */
export function getNextDueDate(
  recurrence: Recurrence,
  currentDueDate: Date,
): Date | null {
  if (recurrence === "NONE") return null;

  const next = new Date(currentDueDate);

  switch (recurrence) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      return null;
  }

  return next;
}

/**
 * Checks whether a new occurrence should be created based on recurrence settings.
 */
export function shouldCreateNextOccurrence(
  recurrence: Recurrence,
  recurrenceEndDate: Date | null,
  currentDueDate: Date,
): boolean {
  if (recurrence === "NONE") return false;

  const nextDate = getNextDueDate(recurrence, currentDueDate);
  if (!nextDate) return false;

  if (recurrenceEndDate && nextDate > recurrenceEndDate) return false;

  return true;
}
