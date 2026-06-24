import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, Priority, Recurrence } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";
import type { TaskWithSubtasks } from "@/hooks/useSubjects";
import {
  patchSubjectCaches,
  restoreSubjectCaches,
  mapTasks,
  reorderTaskList,
} from "@/lib/subject-cache";

export type TaskWithSubject = Task & {
  subject: { id: string; title: string; color: string | null };
};

export type CreateTaskInput = {
  subjectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  estimatedTime?: number;
  recurrence?: Recurrence | null;
};

export type UpdateTaskInput = Partial<
  Omit<CreateTaskInput, "subjectId"> & { isCompleted: boolean; timeSpent: number }
>;

// Tasks scoped to a subject or milestone.
export function useTasks(params?: { subjectId?: string; milestoneId?: string }) {
  const qs = new URLSearchParams();
  if (params?.subjectId) qs.set("subjectId", params.subjectId);
  if (params?.milestoneId) qs.set("milestoneId", params.milestoneId);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: ["tasks", params ?? {}],
    queryFn: () => api.get<Task[]>(`/api/tasks${suffix}`),
  });
}

// Cross-subject "Today": incomplete tasks due today or overdue.
export function useTodayTasks() {
  return useQuery({
    queryKey: ["tasks", { today: true }],
    queryFn: () => api.get<TaskWithSubject[]>("/api/tasks?today=true"),
  });
}

// A task change can move progress bars on the subject grid and detail views.
function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["subjects"] });
    qc.invalidateQueries({ queryKey: ["subject"] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => api.post<Task>("/api/tasks", input),
    onSuccess: invalidate,
  });
}

// Optimistic: patch the cached task immediately so the checkbox/edit reflects
// instantly, then reconcile with the server on settle.
export function useUpdateTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) => api.put<Task>(`/api/tasks/${id}`, data),
    onMutate: async ({ id, data }) => {
      const prev = await patchSubjectCaches(qc, (s) =>
        mapTasks(s, (t) => {
          if (t.id !== id) return t;
          const patched = { ...t, ...data } as TaskWithSubtasks;
          if (data.isCompleted !== undefined) {
            patched.completedAt = (data.isCompleted ? new Date() : null) as Task["completedAt"];
          }
          return patched;
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: invalidate,
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => api.post("/api/tasks/reorder", { ids }),
    onMutate: async ({ ids }) => {
      const prev = await patchSubjectCaches(qc, (s) => reorderTaskList(s, ids));
      return { prev };
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: invalidate,
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/tasks/${id}`),
    onMutate: async (id) => {
      const prev = await patchSubjectCaches(qc, (s) => ({
        ...s,
        milestones: s.milestones.map((m) => ({ ...m, tasks: m.tasks.filter((t) => t.id !== id) })),
        tasks: s.tasks.filter((t) => t.id !== id),
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => restoreSubjectCaches(qc, ctx?.prev),
    onSettled: invalidate,
  });
}

export function useTaskTimer() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "start" | "stop" }) =>
      api.post(`/api/tasks/${id}/timer`, { action }),
    onSuccess: invalidate,
  });
}
