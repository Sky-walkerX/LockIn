import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Milestone } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";
import { patchSubjectCaches, restoreSubjectCaches } from "@/lib/subject-cache";

// Milestones are read through the subject detail query (["subject", id]).
// These mutations invalidate that and the subject grid progress.
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["subject"] });
    qc.invalidateQueries({ queryKey: ["subjects"] });
  };
}

export function useCreateMilestone() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { subjectId: string; title: string; notes?: string; order?: number }) =>
      api.post<Milestone>("/api/milestones", input),
    onSuccess: invalidate,
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ title: string; notes: string; order: number; isCompleted: boolean }>;
    }) => api.put<Milestone>(`/api/milestones/${id}`, data),
    onMutate: async ({ id, data }) => {
      const prev = await patchSubjectCaches(qc, (s) => ({
        ...s,
        milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...data } : m)),
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: invalidate,
  });
}

export function useDeleteMilestone() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/milestones/${id}`),
    onSuccess: invalidate,
  });
}
