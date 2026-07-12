"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight, Pencil, Trash2, FileText } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useUpdateMilestone, useDeleteMilestone } from "@/hooks/useMilestones";
import { useReorderTasks } from "@/hooks/useTasks";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { isTempId } from "@/lib/subject-cache";
import { Markdown } from "./markdown";
import { TaskRow } from "./task-row";
import { AddTask } from "./add-task";
import { SortableList } from "./sortable-list";

export function MilestoneItem({
  milestone,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  milestone: MilestoneWithTasks;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const update = useUpdateMilestone();
  const del = useDeleteMilestone();
  const reorderTasks = useReorderTasks();

  const [open, setOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(milestone.title);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(milestone.notes);

  const total = milestone.tasks.length;
  const done = milestone.tasks.filter((t) => t.isCompleted).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  // Optimistic card awaiting its server id — block edits/reorders until then.
  const pending = isTempId(milestone.id);

  const toggleDone = () =>
    update.mutate({ id: milestone.id, data: { isCompleted: !milestone.isCompleted } });

  const saveTitle = () => {
    const t = titleVal.trim();
    if (t && t !== milestone.title) update.mutate({ id: milestone.id, data: { title: t } });
    else setTitleVal(milestone.title);
    setEditingTitle(false);
  };

  const saveNotes = () => {
    update.mutate(
      { id: milestone.id, data: { notes: notesVal } },
      { onSuccess: () => setEditingNotes(false) },
    );
  };

  return (
    <div className={`lk-card overflow-hidden ${pending ? "pointer-events-none opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <Checkbox checked={milestone.isCompleted} onCheckedChange={toggleDone} className="lk-check" />

        {editingTitle ? (
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
                  setTitleVal(milestone.title);
                  setEditingTitle(false);
                }
              }}
              className="h-7"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <ChevronRight
              size={15}
              className={`text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
            />
            <span
              className={`lk-display truncate text-[15px] font-bold tracking-tight ${milestone.isCompleted ? "text-muted-foreground line-through" : ""}`}
            >
              {milestone.title}
            </span>
          </button>
        )}

        <span className="lk-mono hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
          {done}/{total}
        </span>
        <div className="hidden w-16 sm:block">
          <div className="lk-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center">
          <button type="button" onClick={() => setEditingTitle(true)} className="lk-iconbtn" title="Rename">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="lk-iconbtn" title="Move up">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="lk-iconbtn" title="Move down">
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={() => del.mutate(milestone.id)}
            disabled={del.isPending}
            className="lk-iconbtn hover:text-destructive"
            title="Delete milestone"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-border px-3 pb-3 pt-3">
          {/* Notes */}
          {editingNotes ? (
            <div className="mb-3 flex flex-col gap-2">
              <Textarea
                autoFocus
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                placeholder="Notes — markdown supported (headings, lists, code, tables, links)…"
                rows={6}
                className="lk-mono text-[13px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={update.isPending}
                  className="lk-btn px-3 py-1.5 text-[10px] disabled:opacity-50"
                >
                  {update.isPending ? "Saving…" : "Save notes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotesVal(milestone.notes);
                    setEditingNotes(false);
                  }}
                  className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : milestone.notes.trim() ? (
            <div className="group/notes relative mb-3 rounded-md bg-muted/40 p-3">
              <Markdown>{milestone.notes}</Markdown>
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="lk-iconbtn absolute right-1 top-1 opacity-0 transition-opacity group-hover/notes:opacity-100"
                title="Edit notes"
              >
                <Pencil size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="lk-mono mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText size={13} /> Add notes
            </button>
          )}

          {/* Tasks */}
          <div className="flex flex-col gap-0.5">
            <SortableList
              ids={milestone.tasks.map((t) => t.id)}
              onReorder={(ids) => reorderTasks.mutate({ ids })}
            >
              {milestone.tasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </SortableList>
            <AddTask subjectId={milestone.subjectId} milestoneId={milestone.id} />
          </div>
        </div>
      )}
    </div>
  );
}
