import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, format } from "date-fns";
import type { Milestone, Subject } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";
import type { SubjectDetail } from "@/hooks/useSubjects";
import { patchSubjectCaches, replaceMilestone, restoreSubjectCaches } from "@/lib/subject-cache";
import { nextReview, type ReviewRating } from "@/lib/review/schedule";

export type DueReview = Omit<Milestone, "notes"> & { subject: Pick<Subject, "id" | "title" | "color"> };

const REVIEWS_KEY = ["reviews"] as const;

// Milestones due for revision today or earlier, across subjects. Like
// useTodayTasks, the local end-of-day goes along as ?before= and the day in the
// key rolls the list over at local midnight.
export function useDueReviews() {
  const now = new Date();
  const before = endOfDay(now).toISOString();
  return useQuery({
    queryKey: [...REVIEWS_KEY, { day: format(now, "yyyy-MM-dd") }],
    queryFn: () => api.get<DueReview[]>(`/api/reviews?before=${encodeURIComponent(before)}`),
  });
}

// Optimistic: the row leaves the due list and the milestone takes its next
// schedule at once, computed by the same function the server runs.
export function useReviewMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: ReviewRating }) =>
      api.post<Milestone>(`/api/milestones/${id}/review`, { rating }),
    onMutate: async ({ id, rating }) => {
      await qc.cancelQueries({ queryKey: REVIEWS_KEY });
      const prevReviews = qc.getQueriesData<DueReview[]>({ queryKey: REVIEWS_KEY });
      qc.setQueriesData<DueReview[]>({ queryKey: REVIEWS_KEY }, (old) => old?.filter((r) => r.id !== id));
      const prev = await patchSubjectCaches(qc, (s) => ({
        ...s,
        milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...nextReview(m, rating, new Date()) } : m)),
      }));
      return { prev, prevReviews };
    },
    onSuccess: (milestone) => {
      qc.setQueriesData<SubjectDetail>({ queryKey: ["subject"] }, (old) =>
        old ? replaceMilestone(old, milestone.id, milestone) : old,
      );
    },
    onError: (_e, _v, ctx) => {
      restoreSubjectCaches(qc, ctx?.prev);
      ctx?.prevReviews.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: REVIEWS_KEY }),
  });
}
