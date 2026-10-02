import { HydrationBoundary } from "@tanstack/react-query";
import { prefetch, viewerId } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-keys";
import { loadSubjectTree } from "@/lib/subjects/load-tree";
import { SubjectView } from "./subject-view";

// A subject's notes, plan and resources: the whole tree comes with the page.
export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, userId] = await Promise.all([params, viewerId()]);
  const state = userId
    ? await prefetch([
        [
          queryKeys.subject(id),
          async () => {
            // Not found stays a client-side 404, as when the hook fetches it.
            const tree = await loadSubjectTree(userId, id);
            if (!tree) throw new Error("Subject not found");
            return tree;
          },
        ],
      ])
    : undefined;
  return (
    <HydrationBoundary state={state}>
      <SubjectView />
    </HydrationBoundary>
  );
}
