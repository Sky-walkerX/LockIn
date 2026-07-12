"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, GripVertical, Pencil, Trash2, FileText } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useUpdateSubtask, useDeleteSubtask } from "@/hooks/useSubtasks";
import type { Subtask } from "@/app/generated/prisma";
import { isTempId } from "@/lib/subject-cache";
import { Markdown } from "./markdown";

export function SubtaskRow({ subtask }: { subtask: Subtask }) {
  const update = useUpdateSubtask();
  const del = useDeleteSubtask();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleVal, setTitleVal] = useState(subtask.title);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(subtask.notes);

  const hasNotes = subtask.notes.trim().length > 0;
  // Optimistic row awaiting its server id — block edits/toggles/drags until then.
  const pending = isTempId(subtask.id);

  const toggle = () => update.mutate({ id: subtask.id, data: { isCompleted: !subtask.isCompleted } });

  const saveTitle = () => {
    const t = titleVal.trim();
    if (t && t !== subtask.title) update.mutate({ id: subtask.id, data: { title: t } });
    else setTitleVal(subtask.title);
    setRenaming(false);
  };

  const saveNotes = () => {
    update.mutate({ id: subtask.id, data: { notes: notesVal } }, { onSuccess: () => setEditingNotes(false) });
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md ${isDragging ? "relative z-10 bg-muted/70 shadow-sm" : ""} ${pending ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="group flex items-center gap-1.5 py-1 pl-1 pr-1.5">
        <button
          type="button"
          className="lk-grip"
          aria-label="Drag to reorder subtask"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={13} />
        </button>

        <Checkbox checked={subtask.isCompleted} onCheckedChange={toggle} className="lk-check size-3.5" />

        {renaming ? (
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              saveTitle();
            }}
          >
            <Input
              autoFocus
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTitleVal(subtask.title);
                  setRenaming(false);
                }
              }}
              className="h-6 text-[13px]"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex flex-1 items-center gap-1.5 text-left"
          >
            <ChevronRight
              size={12}
              className={`flex-none text-muted-foreground/70 transition-transform ${open ? "rotate-90" : ""} ${hasNotes ? "" : "opacity-40"}`}
            />
            <span
              className={`truncate text-[13px] ${subtask.isCompleted ? "text-muted-foreground line-through" : ""}`}
            >
              {subtask.title}
            </span>
            {hasNotes && !open && <FileText size={11} className="flex-none text-muted-foreground/60" />}
          </button>
        )}

        <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={() => setRenaming(true)} className="lk-iconbtn" title="Rename subtask">
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={() => del.mutate(subtask.id)}
            disabled={del.isPending}
            className="lk-iconbtn hover:text-destructive"
            title="Delete subtask"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {open && (
        <div className="mb-1 ml-7 mr-1.5">
          {editingNotes ? (
            <div className="flex flex-col gap-2">
              <Textarea
                autoFocus
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                placeholder="Notes — markdown supported…"
                rows={4}
                className="lk-mono text-[12.5px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={update.isPending}
                  className="lk-btn px-2.5 py-1 text-[10px] disabled:opacity-50"
                >
                  {update.isPending ? "Saving…" : "Save notes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotesVal(subtask.notes);
                    setEditingNotes(false);
                  }}
                  className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : hasNotes ? (
            <div className="group/n relative rounded-md bg-muted/40 p-2.5">
              <Markdown>{subtask.notes}</Markdown>
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="lk-iconbtn absolute right-0.5 top-0.5 opacity-0 transition-opacity group-hover/n:opacity-100"
                title="Edit notes"
              >
                <Pencil size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="lk-mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText size={12} /> Add notes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
