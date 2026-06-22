"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";

export function AddTask({
  subjectId,
  milestoneId = null,
}: {
  subjectId: string;
  milestoneId?: string | null;
}) {
  const [title, setTitle] = useState("");
  const create = useCreateTask();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    create.mutate(
      { subjectId, milestoneId, title: t },
      { onSuccess: () => setTitle("") },
    );
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-1.5 py-1">
      <Plus size={14} className="text-muted-foreground" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        className="lk-mono flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {title.trim() && (
        <button
          type="submit"
          disabled={create.isPending}
          className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {create.isPending ? "…" : "enter ↵"}
        </button>
      )}
    </form>
  );
}
