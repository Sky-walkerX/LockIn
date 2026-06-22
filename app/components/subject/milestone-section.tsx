"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCreateMilestone, useUpdateMilestone } from "@/hooks/useMilestones";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { MilestoneItem } from "./milestone-item";

const FALLBACK = "#8b8f9e";

export function MilestoneSection({
  subjectId,
  color,
  milestones,
}: {
  subjectId: string;
  color: string | null;
  milestones: MilestoneWithTasks[];
}) {
  const create = useCreateMilestone();
  const update = useUpdateMilestone();
  const [title, setTitle] = useState("");

  // Reorder by swapping `order` with the adjacent milestone.
  const move = (index: number, dir: -1 | 1) => {
    const a = milestones[index];
    const b = milestones[index + dir];
    if (!a || !b) return;
    update.mutate({ id: a.id, data: { order: b.order } });
    update.mutate({ id: b.id, data: { order: a.order } });
  };

  const addMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    create.mutate({ subjectId, title: t }, { onSuccess: () => setTitle("") });
  };

  return (
    <section className="lk-subject" style={{ "--c": color ?? FALLBACK } as React.CSSProperties}>
      <div className="lk-sec mb-3">plan · {milestones.length} milestones</div>

      {milestones.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          No milestones yet. Break the subject into phases below.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {milestones.map((m, i) => (
            <MilestoneItem
              key={m.id}
              milestone={m}
              isFirst={i === 0}
              isLast={i === milestones.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
            />
          ))}
        </div>
      )}

      <form onSubmit={addMilestone} className="mt-2.5 flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5">
        <Plus size={15} className="text-muted-foreground" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a milestone (phase)…"
          className="lk-display flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        {title.trim() && (
          <button
            type="submit"
            disabled={create.isPending}
            className="lk-btn px-2.5 py-1.5 text-[10px] disabled:opacity-50"
          >
            {create.isPending ? "…" : "Add"}
          </button>
        )}
      </form>
    </section>
  );
}
