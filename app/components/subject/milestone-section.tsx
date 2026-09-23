"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useCreateMilestone, useReorderMilestones } from "@/hooks/useMilestones";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { MilestoneItem } from "./milestone-item";
import { CONFIDENCE_META } from "@/app/components/review/revision";
import type { Confidence } from "@/app/generated/prisma";

type Filter = "ALL" | Confidence | "UNRATED";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "all" },
  ...(Object.keys(CONFIDENCE_META) as Confidence[]).map((c) => ({ value: c, label: CONFIDENCE_META[c].label })),
  { value: "UNRATED", label: "unrated" },
];

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
  const [filter, setFilter] = useState<Filter>("ALL");

  // The chips only earn their space once something has been rated.
  const anyRated = milestones.some((m) => m.confidence);
  const active = anyRated ? filter : "ALL";
  const shown =
    active === "ALL"
      ? milestones
      : milestones.filter((m) => (active === "UNRATED" ? !m.confidence : m.confidence === active));

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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="lk-sec">plan · {milestones.length} milestones</div>
        {anyRated && (
          <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Filter by confidence">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={active === f.value}
                onClick={() => setFilter(f.value)}
                className={`lk-tag transition-colors ${active === f.value ? "text-foreground" : "hover:text-foreground"}`}
                style={active === f.value ? { borderColor: "var(--foreground)" } : undefined}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {milestones.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          No milestones yet. Break the subject into phases below.
        </p>
      ) : shown.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">No milestones match this filter.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((m, i) => (
            <MilestoneItem
              key={m.id}
              milestone={m}
              // Moving swaps with the neighbour in the full list, which a
              // filter may be hiding, so reordering waits until it's cleared.
              isFirst={active !== "ALL" || i === 0}
              isLast={active !== "ALL" || i === shown.length - 1}
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
