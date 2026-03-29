import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Todo, Tag } from "@/app/generated/prisma"

export type TodoWithRelations = Todo & {
  tags: Tag[];
  subTasks: (Todo & { tags: Tag[] })[];
};

export function useTodos(enabled = true) {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async (): Promise<TodoWithRelations[]> => {
      const response = await fetch("/api/todos", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }
      return response.json();
    },
    enabled,
  });
}


export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todoData: Record<string, unknown>) => {
      const response = await fetch("/api/todos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      });
      if (!response.ok) {
        throw new Error("Failed to create todo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}


export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update todo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}


export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete todo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useCreateMultipleTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTodos: Record<string, unknown>[]) => {
      const response = await fetch(`/api/todos/bulk`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: newTodos }),
      });
      if (!response.ok) {
        throw new Error("Failed to create multiple todos");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useReorderTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const response = await fetch("/api/todos/reorder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to reorder todos");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useTimerSessions() {
  return useQuery({
    queryKey: ["timer-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/timer-sessions", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch timer sessions");
      }
      return response.json();
    },
  });
}

export function useSaveTimerSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionData: {
      todoId: string;
      startedAt: string;
      endedAt: string;
      duration: number;
    }) => {
      const response = await fetch("/api/timer-sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) {
        throw new Error("Failed to save timer session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export type TagWithCount = Tag & { _count: { todos: number } };

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async (): Promise<TagWithCount[]> => {
      const response = await fetch("/api/tags", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      return response.json();
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: { name: string; color?: string }) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagData),
      });
      if (!response.ok) {
        throw new Error("Failed to create tag");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/tags", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete tag");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
