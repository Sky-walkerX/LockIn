"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minimize2, Pencil } from "lucide-react";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { useNoteDraft } from "@/hooks/useNoteDraft";
import { Markdown } from "@/app/components/subject/markdown";
import { NotesEditor } from "@/app/components/subject/notes-editor-lazy";
import { useAgo } from "@/app/components/clock";
import { isOwnNote, sourceLabel } from "@/lib/notes/source";
import { pageLabel } from "@/lib/notes/page-label";

// One note and nothing else: the whole window becomes the page. It also asks
// the browser for real full screen, and falls back to just covering the window
// where that's refused (Safari in some contexts, embedded frames). Esc leaves;
// while editing, the first Esc cancels the edit and the second leaves.
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
  const draft = useNoteDraft(note.id);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Whatever opened the sheet (its Full screen button) gets focus back. Read
  // on the first render, before the sheet takes focus.
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  const close = useEffectEvent(onClose);
  // Leaving browser full screen mid-edit keeps the page up, so the draft isn't
  // thrown away; Esc again (or Exit) closes it once the edit is done.
  const browserExit = useEffectEvent(() => {
    if (!draft.editing) onClose();
  });

  useEffect(() => {
    const sheet = sheetRef.current;
    sheet?.focus();
    const scrollY = window.scrollY;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    sheet?.requestFullscreen?.().catch(() => {});

    // In browser full screen the browser takes Esc itself to leave it, and the
    // keydown never arrives: follow it out instead.
    // Entering it moves focus to <body>, so take it back.
    const onFullscreenChange = () => {
      if (document.fullscreenElement) sheet?.focus();
      else browserExit();
    };
    // Outside browser full screen Esc comes to us. An editor that used the key
    // (cancelling the edit) has already claimed it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) close();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.scrollTo({ top: scrollY });
      // Leaving browser full screen resets focus to <body> once it settles, so
      // hand focus back after that, not before, and only once the sheet is
      // really gone (React's dev mode runs this cleanup and remounts it).
      const refocus = () =>
        requestAnimationFrame(() => {
          if (!sheet?.isConnected) opener?.focus({ preventScroll: true });
        });
      if (document.fullscreenElement) document.exitFullscreen().then(refocus, refocus);
      else refocus();
    };
  }, [opener]);

  return createPortal(
    <div
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
        {draft.editing ? (
          <NotesEditor
            value={draft.failed ?? note.notes}
            breadcrumb={note.title}
            placeholder="Write in markdown…"
            onSave={draft.save}
            onCancel={draft.cancel}
          />
        ) : note.notes.trim() ? (
          <div className="lk-reading lk-reading-full">
            <Markdown>{note.notes}</Markdown>
          </div>
        ) : (
          <p className="lk-note-empty">Nothing written yet. Press Edit to start.</p>
        )}
      </article>
    </div>,
    document.body,
  );
}
