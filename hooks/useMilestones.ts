import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Confidence, Milestone } from "@/app/generated/prisma/browser";
import { api } from "@/lib/fetcher";
import type { MilestoneWithTasks, SubjectDetail } from "@/hooks/useSubjects";
import {
  patchSubjectCaches,
  restoreSubjectCaches,
  addMilestoneToSubject,
  replaceMilestone,
  reorderMilestones,
  tempId,
} from "@/lib/subject-cache";

// Milestones (notes) are read through the subject detail query (["subject",
// id]). These mutations invalidate that, the spine's subject counts, and the
// cross-subject note lists (home contents, Inbox counts).
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["subject"] });
    qc.invalidateQueries({ queryKey: ["subjects"] });
    qc.invalidateQueries({ queryKey: ["notes"] });
    qc.invalidateQueries({ queryKey: ["inbox"] });
  };
}

// Optimistic: append a temp milestone immediately, swap for the server row on
// success, roll back on error.
export function useCreateMilestone() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { subjectId: string; title: string; notes?: string; order?: number }) =>
      api.post<Milestone>("/api/milestones", input),
    onMutate: async (input) => {
      const optimistic: MilestoneWithTasks = {
        id: tempId(),
        title: input.title,
        notes: input.notes ?? "",
        order: input.order ?? Number.MAX_SAFE_INTEGER, // sorts last, like the server append
        isCompleted: false,
        completedAt: null,
        confidence: null,
        reviewDueAt: null,
        reviewInterval: null,
        reviewCount: 0,
        lastReviewedAt: null,
        weight: 1,
        source: "web",
        witnessedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        subjectId: input.subjectId,
        tasks: [],
      };
      const prev = await patchSubjectCaches(qc, (s) => addMilestoneToSubject(s, optimistic));
      return { prev, tempId: optimistic.id };
    },
    onSuccess: (milestone, _input, ctx) => {
      qc.setQueriesData<SubjectDetail>({ queryKey: ["subject"] }, (old) =>
        old && ctx ? replaceMilestone(old, ctx.tempId, milestone) : old,
      );
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: invalidate,
  });
}

export type MilestoneUpdate = Partial<{
  title: string;
  notes: string;
  order: number;
  isCompleted: boolean;
  confidence: Confidence | null;
  reviewDueAt: string | null; // ISO; null stops revising
  reviewInterval: number | null;
  weight: number;
  /** Sign off on an agent's note. */
  witnessed: true;
}>;

// The optimistic patch plus the server's returned row cover every field here,
// so no refetch — a title/notes edit changes nothing outside this milestone.
// Completion and review-date changes do move the cross-subject revision list.
export function useUpdateMilestone() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MilestoneUpdate }) =>
      api.put<Milestone>(`/api/milestones/${id}`, data),
    onMutate: async ({ id, data }) => {
      const { reviewDueAt, witnessed, ...rest } = data;
      const patch: Partial<Milestone> = { ...rest };
      if (reviewDueAt !== undefined) patch.reviewDueAt = reviewDueAt ? new Date(reviewDueAt) : null;
      if (witnessed) patch.witnessedAt = new Date();
      const prev = await patchSubjectCaches(qc, (s) => ({
        ...s,
        milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
      return { prev };
    },
    onSuccess: (milestone, { data }) => {
      qc.setQueriesData<SubjectDetail>({ queryKey: ["subject"] }, (old) =>
        old ? replaceMilestone(old, milestone.id, milestone) : old,
      );
      if (data.isCompleted !== undefined || data.reviewDueAt !== undefined) {
        qc.invalidateQueries({ queryKey: ["reviews"] });
      }
      if (data.witnessed || data.title !== undefined || data.notes !== undefined) {
        qc.invalidateQueries({ queryKey: ["notes"] });
        qc.invalidateQueries({ queryKey: ["inbox"] });
      }
    },
    // A failed save still refetches, so the rolled-back cache can't drift from a
    // server that may have applied part of the write.
    onError: (_e, _v, ctx) => {
      restoreSubjectCaches(qc, ctx?.prev);
      invalidate();
    },
  });
}

// Optimistic + atomic: re-sorts the cached list immediately and persists all
// orders in one transaction.
export function useReorderMilestones() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => api.post("/api/milestones/reorder", { ids }),
    onMutate: async ({ ids }) => {
      const prev = await patchSubjectCaches(qc, (s) => reorderMilestones(s, ids));
      return { prev };
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: invalidate,
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/milestones/${id}`),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

// File a note under another subject. Not optimistic: the note leaves one cached
// subject and joins another, with its tasks, so both are refetched instead.
export function useMoveMilestone() {
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, subjectId }: { id: string; subjectId: string }) =>
      api.post<Milestone>(`/api/milestones/${id}/move`, { subjectId }),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
