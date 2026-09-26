import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { SearchHit } from "@/lib/search/hits";

// Results for the search palette. Under two characters nothing is sent (the
// route would drop the term anyway). The last results stay on screen while the
// next ones load, so the list doesn't blank out on every keystroke. Never
// cached as fresh: a note edited a moment ago should show its new text.
export function useSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ["search", query],
    enabled: query.length >= 2,
    queryFn: () => api.get<SearchHit[]>(`/api/search?q=${encodeURIComponent(query)}`),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
