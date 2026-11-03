import { HydrationBoundary } from "@tanstack/react-query";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prefetch, spinePrefetches, viewerClock } from "@/lib/prefetch";
import { Providers } from "@/app/components/QueryProviders";
import { ClockProvider } from "@/app/components/clock";
import { AppShell } from "@/app/components/shell/app-shell";
import { WORKSPACE_BOOT } from "@/lib/zen-workspace";

// The notebook: the spine, Ask, the palette and quick add around every page.
export default async function NotebookLayout({ children }: { children: React.ReactNode }) {
  // A JWT decode, no database. The client starts with the session settled, so
  // the frame draws once instead of waiting on /api/auth/session.
  const [session, clock] = await Promise.all([getServerSession(authOptions), viewerClock()]);
  // The spine's data comes with the first response. Client navigations keep
  // this layout, so it's fetched once per load, not per page.
  const userId = session?.user?.id;
  const state = userId ? await prefetch(spinePrefetches(userId, clock.zone, clock.now)) : undefined;
  return (
    <ClockProvider zone={clock.zone} now={clock.now}>
      {/* The Zen workspace's class, set before the page first paints. */}
      <script dangerouslySetInnerHTML={{ __html: WORKSPACE_BOOT }} />
      <Providers session={session}>
        <HydrationBoundary state={state}>
          <AppShell>{children}</AppShell>
        </HydrationBoundary>
      </Providers>
    </ClockProvider>
  );
}
