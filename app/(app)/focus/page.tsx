import { HydrationBoundary } from "@tanstack/react-query";
import { prefetch, viewerId } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-keys";
import { listTasks } from "@/lib/tasks/list";
import { FocusView } from "./focus-view";

// The focus timer, with the tasks to pick from.
export default async function FocusPage() {
  const userId = await viewerId();
  const state = userId ? await prefetch([[queryKeys.tasks(), () => listTasks(userId)]]) : undefined;
  return (
    <HydrationBoundary state={state}>
      <FocusView />
    </HydrationBoundary>
  );
}
