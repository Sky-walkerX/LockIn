import { HydrationBoundary } from "@tanstack/react-query";
import { NotebookHome } from "@/app/components/home/notebook-home";
import { prefetch, viewerId } from "@/lib/prefetch";
import { CONTENTS_RECENT_NOTES, queryKeys } from "@/lib/query-keys";
import { listRecentNotes } from "@/lib/notes/recent";

// The notebook's contents. A signed-in visit to `/` is rewritten here (see
// next.config.ts), so the address stays `/`. The spine's queries come from the
// layout; the recent notes come with this page.
export default async function ContentsPage() {
  const userId = await viewerId();
  const state = userId
    ? await prefetch([[queryKeys.recentNotes(CONTENTS_RECENT_NOTES), () => listRecentNotes(userId, CONTENTS_RECENT_NOTES)]])
    : undefined;
  return (
    <HydrationBoundary state={state}>
      <NotebookHome />
    </HydrationBoundary>
  );
}
