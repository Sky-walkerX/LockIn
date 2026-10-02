import { HydrationBoundary } from "@tanstack/react-query";
import { prefetch, viewerId } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-keys";
import { getOrCreateInbox } from "@/lib/subjects/inbox";
import { loadSubjectTree } from "@/lib/subjects/load-tree";
import { InboxView } from "./inbox-view";

// Unfiled notes. The Inbox is a subject underneath; its tree comes with the
// page, so the list doesn't wait for the Inbox's id first.
export default async function InboxPage() {
  const userId = await viewerId();
  let state;
  if (userId) {
    const inboxId = await getOrCreateInbox(userId);
    state = await prefetch([[queryKeys.subject(inboxId), () => loadSubjectTree(userId, inboxId)]]);
  }
  return (
    <HydrationBoundary state={state}>
      <InboxView />
    </HydrationBoundary>
  );
}
