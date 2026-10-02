import { formatDistanceStrict } from "date-fns";

/**
 * "4 minutes ago", or "just now" inside the last minute, where a count of
 * seconds reads as a timer rather than a date. Components pass the clock's
 * `now` (app/components/clock.tsx) so the server's render and the browser's
 * first one say the same thing.
 */
export function ago(date: Date | string, now: number = Date.now()): string {
  const at = new Date(date);
  if (now - at.getTime() < 60_000) return "just now";
  return formatDistanceStrict(at, now, { addSuffix: true });
}
