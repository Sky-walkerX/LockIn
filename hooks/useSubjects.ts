import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Subject, Milestone, Task, Subtask, Resource } from "@/app/generated/prisma";
import { api } from "@/lib/fetcher";

export type SubjectWithProgress = Subject & {
  _count: { milestones: number; tasks: number; resources: number };
  totalTasks: number;
  completedTasks: number;
};

// Subtasks nest one level: top-level subtasks carry their children inline.
export type SubtaskWithChildren = Subtask & { children: Subtask[] };

export type TaskWithSubtasks = Task & { subtasks: SubtaskWithChildren[] };

export type MilestoneWithTasks = Milestone & { tasks: TaskWithSubtasks[] };

export type SubjectDetail = Subject & {
  milestones: MilestoneWithTasks[];
  tasks: TaskWithSubtasks[]; // loose tasks (no milestone)
  resources: Resource[];
};

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get<SubjectWithProgress[]>("/api/subjects"),
  });
}

export function useSubject(id: string | undefined) {
  return useQuery({
    queryKey: ["subject", id],
    enabled: !!id,
    queryFn: () => api.get<SubjectDetail>(`/api/subjects/${id}`),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string; color?: string }) =>
      api.post<Subject>("/api/subjects", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ title: string; description: string | null; color: string | null; isArchived: boolean }>;
    }) => api.put<Subject>(`/api/subjects/${id}`, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["subject", vars.id] });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}
