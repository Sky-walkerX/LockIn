import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { InboxSummary } from "@/app/api/inbox/route";

export type { InboxSummary };

// The Inbox's id and counts. The first call creates the Inbox, so anything that
// needs its id (the spine, the Inbox page) reads it from here.
export function useInbox(enabled = true) {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: () => api.get<InboxSummary>("/api/inbox"),
    enabled,
  });
}
