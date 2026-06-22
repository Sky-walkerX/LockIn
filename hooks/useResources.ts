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
