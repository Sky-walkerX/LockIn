import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Chapter } from "@/app/generated/prisma/browser";
import { api } from "@/lib/fetcher";
import type { SubjectDetail } from "@/hooks/useSubjects";
import {
  addChapter,
  patchSubjectCaches,
  removeChapter,
  renameChapter,
  reorderChapters,
  replaceChapter,
  restoreSubjectCaches,
  tempId,
} from "@/lib/subject-cache";

// A subject's chapters live on its detail query (["subject", id]), like its
// notes. Each change shows at once and is rolled back if the server says no.
function useSettle() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["subject"] });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  const settle = useSettle();
  return useMutation({
    mutationFn: (input: { subjectId: string; title: string }) => api.post<Chapter>("/api/chapters", input),
    onMutate: async (input) => {
      const optimistic: Chapter = {
        id: tempId(),
        title: input.title,
        subjectId: input.subjectId,
        order: Number.MAX_SAFE_INTEGER, // last, like the server's
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const prev = await patchSubjectCaches(qc, (s) => addChapter(s, optimistic));
      return { prev, tempId: optimistic.id };
    },
    onSuccess: (chapter, _input, ctx) => {
      qc.setQueriesData<SubjectDetail>({ queryKey: ["subject"] }, (old) =>
        old && ctx ? replaceChapter(old, ctx.tempId, chapter) : old,
      );
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: settle,
  });
}

export function useRenameChapter() {
  const qc = useQueryClient();
  const settle = useSettle();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.put<Chapter>(`/api/chapters/${id}`, { title }),
    onMutate: async ({ id, title }) => ({ prev: await patchSubjectCaches(qc, (s) => renameChapter(s, id, title)) }),
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: settle,
  });
}

export function useDeleteChapter() {
  const qc = useQueryClient();
  const settle = useSettle();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/chapters/${id}`),
    onMutate: async (id) => ({ prev: await patchSubjectCaches(qc, (s) => removeChapter(s, id)) }),
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: settle,
  });
}

export function useReorderChapters() {
  const qc = useQueryClient();
  const settle = useSettle();
  return useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => api.post("/api/chapters/reorder", { ids }),
    onMutate: async ({ ids }) => ({ prev: await patchSubjectCaches(qc, (s) => reorderChapters(s, ids)) }),
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: settle,
  });
}
