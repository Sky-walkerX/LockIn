import { HydrationBoundary } from "@tanstack/react-query";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prefetch, spinePrefetches } from "@/lib/prefetch";
import { Providers } from "@/app/components/QueryProviders";
import { AppShell } from "@/app/components/shell/app-shell";

// The notebook: the spine, Ask, the palette and quick add around every page.
export default async function NotebookLayout({ children }: { children: React.ReactNode }) {
  // A JWT decode, no database. The client starts with the session settled, so
  // the frame draws once instead of waiting on /api/auth/session.
  const session = await getServerSession(authOptions);
  // The spine's data comes with the first response. Client navigations keep
  // this layout, so it's fetched once per load, not per page.
  const state = session?.user?.id ? await prefetch(await spinePrefetches(session.user.id)) : undefined;
  return (
    <Providers session={session}>
      <HydrationBoundary state={state}>
        <AppShell>{children}</AppShell>
      </HydrationBoundary>
    </Providers>
  );
}
