import { useQuery, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { queryKeys } from "@/lib/query-keys";
import type { RecentNote } from "@/lib/notes/recent";

export type { RecentNote };

// Notes across every subject, newest change first. Note edits already
// invalidate ["subject", id]; the home page is the only reader of this list and
// refetches on mount, so it doesn't need wiring into every note mutation.
export function useRecentNotes(limit = 12) {
  return useQuery({
    queryKey: queryKeys.recentNotes(limit),
    queryFn: () => api.get<RecentNote[]>(`/api/notes/recent?limit=${limit}`),
    refetchOnMount: "always",
  });
}

/** The page of the note written last, anywhere in the notebook, or null with none. */
export async function latestNotePage(qc: QueryClient): Promise<string | null> {
  const [latest] = await qc
    .fetchQuery({
      queryKey: queryKeys.recentNotes(1),
      queryFn: () => api.get<RecentNote[]>("/api/notes/recent?limit=1"),
      staleTime: 0,
    })
    .catch(() => []);
  if (!latest) return null;
  return `${latest.subject.isInbox ? "/inbox" : `/subjects/${latest.subject.id}`}?note=${latest.id}`;
}
