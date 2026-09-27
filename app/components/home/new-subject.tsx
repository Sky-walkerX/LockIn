"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { useCreateSubject } from "@/hooks/useSubjects";

// Section-tab inks for new subjects. Existing subjects keep whatever colour
// they were given; these only seed the picker.
export const SUBJECT_PALETTE = [
  "#C25A1C", "#2E7D4F", "#2F5FA0", "#9B3B6A",
  "#6B55A8", "#A8841A", "#0F6B72", "#B4372D",
];

export function NewSubject({
  trigger,
  align = "end",
}: {
  /** Replaces the default "New subject" button, e.g. the spine's "+". */
  trigger?: React.ReactNode;
  align?: "start" | "end";
} = {}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(SUBJECT_PALETTE[0]);
  const create = useCreateSubject();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      { title: title.trim(), color },
      {
        onSuccess: () => {
          setTitle("");
          setColor(SUBJECT_PALETTE[0]);
          setOpen(false);
        },
      },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button type="button" className="lk-btn flex items-center gap-1.5 px-3 py-2 text-2xs">
            <Plus size={14} /> New subject
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="lk-sec">New subject</div>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Operating Systems"
          />
          <div className="flex flex-wrap gap-2">
            {SUBJECT_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Pick ${c}`}
                className={`h-6 w-6 rounded-md border-2 transition-transform ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={create.isPending || !title.trim()}
            className="lk-btn px-3 py-2 text-2xs disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
