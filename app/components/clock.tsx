"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { tz, type TZDate } from "@date-fns/tz";
import { ZONE_COOKIE } from "@/lib/zone";
import { ago } from "@/lib/dates";

// The user's time zone and the current time, for anything that renders a date
// or works out "today". The server renders notebook pages in UTC, so local
// time there is wrong: components read both from here instead. The zone comes
// from the lk-tz cookie (lib/zone.ts) and `now` from the server's render, so
// the server's HTML and the browser's first render agree exactly; after
// hydration `now` follows the real clock.

export type Clock = {
  zone: string;
  now: number;
  /** For date-fns: format(date, "d MMM", { in: clock.in }) works in the user's zone. */
  in: (value: Date | number | string) => TZDate;
};

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const ClockContext = createContext<Clock | null>(null);

// One shared ticking value, read with useSyncExternalStore: during hydration
// React uses the server's `now`, then this one.
let current = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  current = Date.now();
  timer ??= setInterval(() => {
    current = Date.now();
    listeners.forEach((l) => l());
  }, 30_000);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function ClockProvider({ zone, now: serverNow, children }: { zone: string; now: number; children: React.ReactNode }) {
  const now = useSyncExternalStore(subscribe, () => current, () => serverNow);
  const router = useRouter();

  // The server only knows the zone the cookie names (UTC without one). If the
  // browser is somewhere else, save its zone and render again with it.
  useEffect(() => {
    const actual = browserZone();
    if (actual === zone) return;
    document.cookie = `${ZONE_COOKIE}=${encodeURIComponent(actual)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [zone, router]);

  const clock = useMemo<Clock>(() => ({ zone, now, in: tz(zone) }), [zone, now]);
  return <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>;
}

const noSubscription = () => () => {};

/**
 * The clock from the nearest ClockProvider. Outside one (panels that only
 * render in the browser) it's the browser's own zone and the shared clock's
 * last tick.
 */
export function useClock(): Clock {
  const clock = useContext(ClockContext);
  const last = useSyncExternalStore(noSubscription, () => current, () => current);
  return useMemo(() => {
    if (clock) return clock;
    const zone = typeof window === "undefined" ? "UTC" : browserZone();
    return { zone, now: last, in: tz(zone) };
  }, [clock, last]);
}

/** `ago` on the clock: "4 minutes ago" that the server and hydration agree on. */
export function useAgo(): (date: Date | string) => string {
  const { now } = useClock();
  return useCallback((date: Date | string) => ago(date, now), [now]);
}
