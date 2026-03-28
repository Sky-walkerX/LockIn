export interface ExportableTodo {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  isCompleted: boolean;
  dueDate?: string | Date | null;
  completedAt?: string | Date | null;
  estimatedTime?: number | null;
  timeSpent?: number | null;
  createdAt: string | Date;
  tags?: { name: string }[] | string[];
}

export function todosToCSV(todos: ExportableTodo[]): string {
  const headers = [
    "Title",
    "Description",
    "Priority",
    "Status",
    "Due Date",
    "Completed At",
    "Estimated Time (min)",
    "Time Spent (min)",
    "Tags",
    "Created At",
  ];

  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const toStr = (v: string | Date | null | undefined): string => {
    if (!v) return "";
    return v instanceof Date ? v.toISOString() : v;
  };

  const rows = todos.map((todo) => [
    escapeCSV(todo.title),
    escapeCSV(todo.description || ""),
    todo.priority,
    todo.isCompleted ? "Completed" : "Pending",
    toStr(todo.dueDate),
    toStr(todo.completedAt),
    todo.estimatedTime?.toString() || "",
    todo.timeSpent?.toString() || "",
    escapeCSV(
      (todo.tags || [])
        .map((t) => (typeof t === "string" ? t : t.name))
        .join("; ")
    ),
    toStr(todo.createdAt),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function todosToJSON(todos: ExportableTodo[]): string {
  return JSON.stringify(todos, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
