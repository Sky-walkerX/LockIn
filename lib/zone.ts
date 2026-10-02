// The server's view of the user's "today". The browser keys Today and due
// revisions by its local date and asks for everything due by its local
// end-of-day (date-fns: format "yyyy-MM-dd", endOfDay). To prefetch the same
// queries, the server works both out for the user's IANA time zone, which the
// browser keeps in the lk-tz cookie.

export const ZONE_COOKIE = "lk-tz";

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsIn(instant: Date, timeZone: string): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const get = (type: string) => Number(fmt.formatToParts(instant).find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

// How far the zone's wall clock is ahead of UTC at `instant`, in ms.
function offsetAt(instant: Date, timeZone: string): number {
  const p = partsIn(instant, timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The local date (yyyy-MM-dd) at `now` in `timeZone`, and the instant its last
 * millisecond (23:59:59.999 local) falls on. Null for a zone Intl doesn't know.
 */
export function todayIn(timeZone: string, now: Date = new Date()): { day: string; endOfDay: Date } | null {
  let p: Parts;
  try {
    p = partsIn(now, timeZone);
  } catch {
    return null;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  // Local 23:59:59.999 as if it were UTC, then shifted by the zone's offset at
  // that moment. A second pass settles days where the offset changes (DST).
  const wallEnd = Date.UTC(p.year, p.month - 1, p.day, 23, 59, 59, 999);
  let end = wallEnd - offsetAt(new Date(wallEnd), timeZone);
  end = wallEnd - offsetAt(new Date(end), timeZone);
  return { day, endOfDay: new Date(end) };
}
