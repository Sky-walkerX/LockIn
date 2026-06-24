"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCreateSubtask } from "@/hooks/useSubtasks";

export function AddSubtask({ taskId }: { taskId: string }) {
  const [title, setTitle] = useState("");
  const create = useCreateSubtask();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    create.mutate({ taskId, title: t }, { onSuccess: () => setTitle("") });
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5 py-1 pl-7 pr-1.5">
      <Plus size={12} className="text-muted-foreground" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a subtask…"
        className="lk-mono flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
      />
      {title.trim() && (
        <button
          type="submit"
          disabled={create.isPending}
          className="lk-mono text-[9px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {create.isPending ? "…" : "enter ↵"}
        </button>
      )}
    </form>
  );
}
