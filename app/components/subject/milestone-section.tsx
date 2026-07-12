"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useCreateMilestone, useReorderMilestones } from "@/hooks/useMilestones";
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
  const reorder = useReorderMilestones();
  const [title, setTitle] = useState("");

  // Read milestones through a ref so `move` stays referentially stable and
  // memoized MilestoneItems don't re-render on every list change.
  const milestonesRef = useRef(milestones);
  useEffect(() => {
    milestonesRef.current = milestones;
  });

  // Swap with the adjacent milestone and persist the whole order atomically.
  const { mutate: reorderMilestones } = reorder;
  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const ids = milestonesRef.current.map((m) => m.id);
      const i = ids.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      reorderMilestones({ ids });
    },
    [reorderMilestones],
  );

  const addMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    // Clear immediately (the row appears optimistically); restore on failure.
    setTitle("");
    create.mutate({ subjectId, title: t }, { onError: () => setTitle(t) });
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
              onMove={move}
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
          <button type="submit" className="lk-btn px-2.5 py-1.5 text-[10px]">
            Add
          </button>
        )}
      </form>
    </section>
  );
}
