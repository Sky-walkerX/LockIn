import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { queryKeys } from "@/lib/query-keys";
import type { listHandoffs } from "@/lib/handoff/store";
import type { Attention } from "@/lib/notes/attention";

type Json<T> = T extends Date ? string : T extends (infer U)[] ? Json<U>[] : T extends object ? { [K in keyof T]: Json<T[K]> } : T;
export type HandoffRow = Json<Awaited<ReturnType<typeof listHandoffs>>[number]>;
export type AttentionRows = Json<Attention>;

// Agents leave batons and flags over MCP, out of the app's sight, so both
// lists refetch whenever the home page mounts.
export function useHandoffs() {
  return useQuery({
    queryKey: queryKeys.handoffs,
    queryFn: () => api.get<HandoffRow[]>("/api/handoffs"),
    refetchOnMount: "always",
  });
}

export function useAttention() {
  return useQuery({
    queryKey: queryKeys.attention,
    queryFn: () => api.get<AttentionRows>("/api/notes/attention"),
    refetchOnMount: "always",
  });
}

/** The user closes a baton nobody needs to pick up. */
export function useCloseHandoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/handoffs/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.handoffs });
      const prev = qc.getQueryData<HandoffRow[]>(queryKeys.handoffs);
      qc.setQueryData<HandoffRow[]>(queryKeys.handoffs, (list) =>
        list?.map((h) => (h.id === id ? { ...h, status: "PICKED_UP", pickedUpBy: "web", pickedUpAt: new Date().toISOString() } : h)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => qc.setQueryData(queryKeys.handoffs, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.handoffs }),
  });
}
