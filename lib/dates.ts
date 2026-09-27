import { formatDistanceToNowStrict } from "date-fns";

/**
 * "4 minutes ago", or "just now" inside the last minute, where a count of
 * seconds reads as a timer rather than a date.
 */
export function ago(date: Date | string): string {
  const at = new Date(date);
  return Date.now() - at.getTime() < 60_000 ? "just now" : formatDistanceToNowStrict(at, { addSuffix: true });
}
