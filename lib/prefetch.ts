import { QueryClient, dehydrate, type DehydratedState, type QueryKey } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { queryKeys } from "@/lib/query-keys";
import { listSubjects } from "@/lib/subjects/list";
import { getInboxSummary } from "@/lib/subjects/inbox";
import { listTasksDue } from "@/lib/tasks/list";
import { listDueReviews } from "@/lib/review/due";
import { ZONE_COOKIE, resolveZone, todayIn } from "@/lib/zone";

// Data the server puts in a page so it arrives with the page instead of
// after it: each entry is a query key and the loader behind its API route.
export type Prefetch = readonly [QueryKey, () => Promise<unknown>];

/**
 * Runs the loaders together and returns the state for a HydrationBoundary.
 * Results go through JSON as they would through the API route, so the browser
 * sees the same shapes (dates as strings) either way. A loader that throws is
 * left out, and the page's hook fetches that query itself as before.
 */
export async function prefetch(entries: Prefetch[]): Promise<DehydratedState> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await Promise.all(
    entries.map(([queryKey, load]) =>
      client.prefetchQuery({ queryKey, queryFn: async () => JSON.parse(JSON.stringify(await load())) }),
    ),
  );
  return dehydrate(client);
}

/** The signed-in user's id, or null. A JWT decode, no database. */
export async function viewerId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/** The user's zone from the lk-tz cookie (UTC without one) and the time now. */
export async function viewerClock(): Promise<{ zone: string; now: number }> {
  return { zone: resolveZone((await cookies()).get(ZONE_COOKIE)?.value), now: Date.now() };
}

/**
 * What the spine shows on every page: subjects, the Inbox's counts, and
 * what's due today. Today is the user's date in their zone at `now`, the same
 * values the notebook layout hands the browser's clock (app/components/clock.tsx),
 * so these land under the keys the spine's hooks ask for.
 */
export function spinePrefetches(userId: string, zone: string, now: number): Prefetch[] {
  const today = todayIn(zone, new Date(now))!;
  return [
    [queryKeys.subjects, () => listSubjects(userId)],
    [queryKeys.inbox, () => getInboxSummary(userId)],
    [queryKeys.todayTasks(today.day), () => listTasksDue(userId, today.endOfDay)],
    [queryKeys.dueReviews(today.day), () => listDueReviews(userId, today.endOfDay)],
  ];
}
