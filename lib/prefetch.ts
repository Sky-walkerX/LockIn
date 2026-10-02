import { QueryClient, dehydrate, type DehydratedState, type QueryKey } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { queryKeys } from "@/lib/query-keys";
import { listSubjects } from "@/lib/subjects/list";
import { getInboxSummary } from "@/lib/subjects/inbox";
import { listTasksDue } from "@/lib/tasks/list";
import { listDueReviews } from "@/lib/review/due";
import { ZONE_COOKIE, todayIn } from "@/lib/zone";

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

/**
 * What the spine shows on every page: subjects, the Inbox's counts, and
 * what's due today. Today and due revisions are keyed by the user's local
 * date, known from the lk-tz cookie; without it they're left to the browser.
 */
export async function spinePrefetches(userId: string): Promise<Prefetch[]> {
  const zone = (await cookies()).get(ZONE_COOKIE)?.value;
  const today = zone ? todayIn(zone) : null;
  const entries: Prefetch[] = [
    [queryKeys.subjects, () => listSubjects(userId)],
    [queryKeys.inbox, () => getInboxSummary(userId)],
  ];
  if (today) {
    entries.push(
      [queryKeys.todayTasks(today.day), () => listTasksDue(userId, today.endOfDay)],
      [queryKeys.dueReviews(today.day), () => listDueReviews(userId, today.endOfDay)],
    );
  }
  return entries;
}
