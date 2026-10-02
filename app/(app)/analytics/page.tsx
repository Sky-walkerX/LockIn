import { HydrationBoundary } from "@tanstack/react-query";
import AnalyticsPage from "@/app/components/analytics-page";
import { prefetch, viewerId } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-keys";
import { listTasks } from "@/lib/tasks/list";

// Progress is worked out from every task, which come with the page.
export default async function Page() {
  const userId = await viewerId();
  const state = userId ? await prefetch([[queryKeys.tasks(), () => listTasks(userId)]]) : undefined;
  return (
    <HydrationBoundary state={state}>
      <AnalyticsPage />
    </HydrationBoundary>
  );
}
