"use client";

import { useState } from "react";
import { BookMarked, FolderInput, Inbox, Undo2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { useSubject, useSubjects } from "@/hooks/useSubjects";
import { useInbox } from "@/hooks/useInbox";
import { useMoveMilestone } from "@/hooks/useMilestones";

// File a note in a chapter of its section, under another section, or back
// into the Inbox.
export function MoveNoteMenu({
  noteId,
  currentSubjectId,
  onMoved,
  disabled,
}: {
  noteId: string;
  currentSubjectId: string;
  onMoved: (subjectId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: subjects = [] } = useSubjects();
  const { data: inbox } = useInbox();
  const move = useMoveMilestone();
  // Its own section's chapters come from the page that's showing it.
  const { data: here } = useSubject(currentSubjectId);
  const chapters = here && !here.isInbox ? here.chapters : [];
  const inChapter = here?.milestones.find((m) => m.id === noteId)?.chapterId ?? null;
  const chapterTargets = chapters.filter((c) => c.id !== inChapter);
  const file = (chapterId: string | null) =>
    move.mutate({ id: noteId, subjectId: currentSubjectId, chapterId }, { onSuccess: () => setOpen(false) });

  const targets = [
    ...subjects.filter((s) => s.id !== currentSubjectId).map((s) => ({ id: s.id, title: s.title, color: s.color })),
  ];
  const canInbox = inbox && inbox.id !== currentSubjectId;

  const pick = (subjectId: string) =>
    move.mutate(
      { id: noteId, subjectId },
      {
        onSuccess: () => {
          setOpen(false);
          onMoved(subjectId);
        },
      },
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className="lk-note-bar-btn">
          <FolderInput size={14} /> Move
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        {(chapterTargets.length > 0 || inChapter) && (
          <>
            <div className="lk-sec truncate px-2 pb-1.5 pt-1">Chapter in {here?.title}</div>
            <ul className="mb-1.5 grid max-h-48 overflow-y-auto border-b border-border pb-1.5">
              {chapterTargets.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => file(c.id)}
                    disabled={move.isPending}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-ui hover:bg-accent disabled:opacity-50"
                  >
                    <BookMarked size={14} className="flex-none text-muted-foreground" />
                    <span className="truncate">{c.title}</span>
                  </button>
                </li>
              ))}
              {inChapter && (
                <li>
                  <button
                    type="button"
                    onClick={() => file(null)}
                    disabled={move.isPending}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-ui text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                  >
                    <Undo2 size={14} /> Out of its chapter
                  </button>
                </li>
              )}
            </ul>
          </>
        )}
        <div className="lk-sec px-2 pb-1.5 pt-1">File under</div>
        {targets.length === 0 && !canInbox ? (
          <p className="px-2 pb-2 text-sm text-muted-foreground">Add another section to move notes into it.</p>
        ) : (
          <ul className="grid max-h-72 overflow-y-auto">
            {targets.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pick(s.id)}
                  disabled={move.isPending}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-ui hover:bg-accent disabled:opacity-50"
                >
                  <i className="lk-tab-chip" style={{ background: s.color ?? "var(--muted-foreground)" }} aria-hidden />
                  <span className="truncate">{s.title}</span>
                </button>
              </li>
            ))}
            {canInbox && (
              <li>
                <button
                  type="button"
                  onClick={() => pick(inbox.id)}
                  disabled={move.isPending}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-ui text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  <Inbox size={14} /> Back to the Inbox
                </button>
              </li>
            )}
          </ul>
        )}
        {move.isError && <p className="px-2 py-1.5 text-sm text-destructive">That didn&apos;t move. Try again.</p>}
      </PopoverContent>
    </Popover>
  );
}
