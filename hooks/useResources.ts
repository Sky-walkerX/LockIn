import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Resource, ResourceType } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";

export function useResources(subjectId?: string) {
  const suffix = subjectId ? `?subjectId=${subjectId}` : "";
  return useQuery({
    queryKey: ["resources", subjectId ?? "all"],
    queryFn: () => api.get<Resource[]>(`/api/resources${suffix}`),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["resources"] });
    qc.invalidateQueries({ queryKey: ["subject"] });
  };
}

export function useCreateResource() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { subjectId: string; type: ResourceType; url: string; title: string; note?: string }) =>
      api.post<Resource>("/api/resources", input),
    onSuccess: invalidate,
  });
}

export function useUpdateResource() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ type: ResourceType; url: string; title: string; note: string | null }>;
    }) => api.put<Resource>(`/api/resources/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteResource() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/resources/${id}`),
    onSuccess: invalidate,
  });
}

/**
 * Extracts a resource's URL into indexable markdown via the ingest service.
 * `useCreateResource`'s `invalidate` refetches the resource list, which is
 * what picks up the new `ingestState` — there's no separate polling here
 * because the request itself doesn't return until extraction finishes or
 * fails (see the route's doc comment for why this is synchronous).
 */
export function useIngestResource() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ ingestState: string; pageCount: number | null; chars: number }>(
        `/api/resources/${id}/ingest`,
        {},
      ),
    onSuccess: invalidate,
  });
}
