import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, Priority } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";

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

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) => api.put<Task>(`/api/tasks/${id}`, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/tasks/${id}`),
    onSuccess: invalidate,
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
