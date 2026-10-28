"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { Minimize2, Pencil } from "lucide-react";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { useNoteDraft } from "@/hooks/useNoteDraft";
import { useImmersiveSheet } from "@/hooks/useImmersiveSheet";
import { NoteConflict } from "./note-conflict";
import { Markdown } from "@/app/components/subject/markdown";
import { NotesEditor } from "@/app/components/subject/notes-editor-lazy";
import { useAgo } from "@/app/components/clock";
import { isOwnNote, sourceLabel } from "@/lib/notes/source";
import { pageLabel } from "@/lib/notes/page-label";
import * as m from "motion/react-m";

// One note and nothing else: the whole window becomes the page
// (useImmersiveSheet). Esc leaves; while editing, the first Esc cancels the
// edit and the second leaves.
export function NoteFullscreen({
  note,
  sectionTitle,
  color,
  onClose,
}: {
  note: MilestoneWithTasks;
  sectionTitle: string;
  /** The subject's colour. The sheet is portalled out of the page that sets it. */
  color: string | null;
  onClose: () => void;
}) {
  const ago = useAgo();
  const draft = useNoteDraft(note);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Leaving browser full screen mid-edit keeps the page up, so the draft isn't
  // thrown away; Esc again (or Exit) closes it once the edit is done.
  useImmersiveSheet(sheetRef, {
    onClose,
    onBrowserExit: () => {
      if (!draft.editing) onClose();
    },
  });

  return createPortal(
    <m.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.16 } }}
      ref={sheetRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-note-title"
      className="lk-subject lk-fullscreen"
      style={color ? ({ "--c": color } as React.CSSProperties) : undefined}
    >
      <div className="lk-fullscreen-bar">
        <span className="lk-runhead !border-0 !p-0">
          <span>
            <b>{sectionTitle}</b> · Note{note.page != null && <> · {pageLabel(note.page)}</>} · updated {ago(note.updatedAt)}
          </span>
        </span>
        <div className="flex items-center gap-2">
          {!draft.editing && (
            <button type="button" onClick={draft.open} className="lk-note-bar-btn">
              <Pencil size={14} /> Edit
            </button>
          )}
          <button type="button" onClick={onClose} className="lk-note-bar-btn" title="Leave full screen (Esc)">
            <Minimize2 size={14} /> Exit <kbd className="text-xs text-muted-foreground">Esc</kbd>
          </button>
        </div>
      </div>

      <article className="lk-fullscreen-page">
        <h1 id="fullscreen-note-title" className="lk-note-title">
          {note.title}
        </h1>
        {!isOwnNote(note.source) && <p className="lk-provenance">Recorded by {sourceLabel(note.source)}</p>}
        <div className="lk-fullscreen-rule" />
        {draft.editing && draft.conflict && <NoteConflict note={note} />}
        {draft.editing ? (
          <NotesEditor
            value={draft.failed ?? note.notes}
            breadcrumb={note.title}
            page={note.page}
            placeholder="Write in markdown…"
            onSave={draft.save}
            onCancel={draft.cancel}
          />
        ) : note.notes.trim() ? (
          <div className="lk-reading lk-reading-full">
            <Markdown page={note.page}>{note.notes}</Markdown>
          </div>
        ) : (
          <p className="lk-note-empty">Nothing written yet. Press Edit to start.</p>
        )}
      </article>
    </m.div>,
    document.body,
  );
}
