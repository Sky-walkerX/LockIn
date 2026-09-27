"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ListChecks, Maximize2, Pencil, Trash2 } from "lucide-react";
import { ago } from "@/lib/dates";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { useDeleteMilestone, useUpdateMilestone } from "@/hooks/useMilestones";
import { useNoteDraft } from "@/hooks/useNoteDraft";
import { Markdown } from "@/app/components/subject/markdown";
import { NotesEditor } from "@/app/components/subject/notes-editor-lazy";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { isTempId } from "@/lib/subject-cache";
import { NoteFullscreen } from "./note-fullscreen";

// One note as a page: a running head, the title, then the body on clean paper.
// Reading is the default; the editor opens in place.
export function NoteView({
  note,
  sectionTitle,
  planHref,
  backHref,
  startEditing = false,
  onDeleted,
}: {
  note: MilestoneWithTasks;
  sectionTitle: string;
  /** Null where the note has no Plan to show. */
  planHref: string | null;
  /** Phones show the list or the page, never both: this leads back to the list. */
  backHref: string;
  startEditing?: boolean;
  onDeleted: () => void;
}) {
  const update = useUpdateMilestone();
  const del = useDeleteMilestone();
  const draft = useNoteDraft(note.id);
  const [renaming, setRenaming] = useState(false);
  const [titleVal, setTitleVal] = useState(note.title);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Holds the subject colour while open: read off the page when full screen
  // opens, since the full-screen sheet renders outside it.
  const [fullscreen, setFullscreen] = useState<{ color: string | null } | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const pending = isTempId(note.id);

  // A note that was just created opens straight into the editor, once.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (startEditing && opened.current !== note.id) {
      opened.current = note.id;
      draft.open();
    }
  }, [startEditing, note.id, draft]);

  const saveTitle = () => {
    const t = titleVal.trim();
    if (t && t !== note.title) update.mutate({ id: note.id, data: { title: t } });
    setRenaming(false);
  };

  const remove = () => {
    setConfirmOpen(false);
    del.mutate(note.id);
    onDeleted();
  };


  return (
    <article ref={pageRef} className="lk-note-page" aria-labelledby="note-title">
      {fullscreen && (
        <NoteFullscreen note={note} sectionTitle={sectionTitle} color={fullscreen.color} onClose={() => setFullscreen(null)} />
      )}
      <div className="lk-runhead">
        <Link href={backHref} scroll={false} className="flex items-center gap-1.5 lg:hidden">
          <ArrowLeft size={13} /> All notes
        </Link>
        <span className="hidden lg:inline">
          <b>{sectionTitle}</b> · Note
        </span>
        <span>Updated {ago(note.updatedAt)}</span>
      </div>

      {renaming ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveTitle();
          }}
        >
          <label htmlFor="note-title-input" className="sr-only">
            Note title
          </label>
          <input
            id="note-title-input"
            autoFocus
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setTitleVal(note.title);
                setRenaming(false);
              }
            }}
            className="lk-note-title w-full bg-transparent outline-none"
          />
        </form>
      ) : (
        <h2 id="note-title" className="lk-note-title">
          <button
            type="button"
            onClick={() => {
              setTitleVal(note.title);
              setRenaming(true);
            }}
            disabled={pending}
            className="text-left"
            title="Rename"
          >
            {note.title}
          </button>
        </h2>
      )}

      <div className="lk-note-bar">
        {planHref && (
          <Link href={planHref} className="lk-note-bar-link">
            <ListChecks size={14} />
            {note.tasks.length > 0
              ? `${note.tasks.filter((t) => t.isCompleted).length}/${note.tasks.length} tasks in Plan`
              : "Plan tasks for this note"}
          </Link>
        )}
        <span className="flex-1" />
        {!draft.editing && (
          <button type="button" onClick={draft.open} disabled={pending} className="lk-note-bar-btn">
            <Pencil size={14} /> Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const c = pageRef.current ? getComputedStyle(pageRef.current).getPropertyValue("--c").trim() : "";
            setFullscreen({ color: c || null });
          }}
          disabled={pending || draft.editing}
          className="lk-iconbtn"
          title="Full screen"
          aria-label="Full screen"
        >
          <Maximize2 size={14} />
        </button>
        <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
          <PopoverTrigger asChild>
            <button type="button" disabled={pending} className="lk-iconbtn hover:text-destructive" title="Delete note">
              <Trash2 size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="flex flex-col gap-3">
              <div className="lk-sec">Delete this note?</div>
              <p className="text-sm text-muted-foreground">
                {note.tasks.length > 0
                  ? `Its ${note.tasks.length} task${note.tasks.length === 1 ? "" : "s"} stay in Plan, no longer tied to a note.`
                  : "This can't be undone."}
              </p>
              <button
                type="button"
                onClick={remove}
                className="lk-btn px-3 py-2 text-2xs"
                style={{ background: "var(--destructive)", borderColor: "var(--destructive)", color: "#fff" }}
              >
                Delete note
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="lk-note-body">
        {draft.editing ? (
          <NotesEditor
            value={draft.failed ?? note.notes}
            placeholder="Write in markdown: headings, lists, code, tables, links…"
            onSave={draft.save}
            onCancel={draft.cancel}
          />
        ) : note.notes.trim() ? (
          <div className="lk-reading">
            <Markdown>{note.notes}</Markdown>
          </div>
        ) : (
          <div className="lk-note-empty">
            <p>Nothing written yet.</p>
            <button type="button" onClick={draft.open} disabled={pending} className="lk-btn px-3 py-2 text-2xs">
              Write this note
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
