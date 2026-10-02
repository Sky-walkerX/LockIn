import { useQuery } from "@tanstack/react-query";
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
