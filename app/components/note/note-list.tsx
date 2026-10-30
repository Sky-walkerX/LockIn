"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, FolderPlus, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useAgo } from "@/app/components/clock";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import type { Chapter } from "@/app/generated/prisma/browser";
import { useCreateMilestone } from "@/hooks/useMilestones";
import { useCreateChapter, useDeleteChapter, useRenameChapter, useReorderChapters } from "@/hooks/useChapters";
import { SortableList } from "@/app/components/subject/sortable-list";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { isTempId } from "@/lib/subject-cache";
import { excerpt } from "@/lib/notes/excerpt";
import { groupByChapter } from "@/lib/notes/chapters";

// A section's notes in their order, with a line of each: the ones in no
// chapter first, then each chapter under a heading that folds. The new-note
// field sits on top: a title is enough to start, and the note opens ready to
// write. A chapter can take a new note of its own, be renamed, dragged into
// another place, or removed (its notes stay in the section).
export function NoteList({
  subjectId,
  sectionTitle,
  notes,
  chapters,
  selectedId,
  hrefFor,
  onCreated,
  placeholder = "New note…",
}: {
  subjectId: string;
  sectionTitle: string;
  notes: MilestoneWithTasks[];
  /** Left out where there are none to have (the Inbox). */
  chapters?: Chapter[];
  selectedId: string | null;
  hrefFor: (noteId: string) => string;
  onCreated: (noteId: string) => void;
  placeholder?: string;
}) {
  const canChapter = chapters !== undefined;
  const createChapter = useCreateChapter();
  const reorder = useReorderChapters();
  const [naming, setNaming] = useState(false);
  const folded = useFolded();
  const { loose, groups } = groupByChapter(notes, chapters ?? []);
  const selectedChapter = notes.find((n) => n.id === selectedId)?.chapterId ?? null;

  // Arriving at a note (from Go to, Zen, a link) opens its chapter so it can be
  // seen. Only on arriving: after that the arrow folds the chapter like any other.
  useEffect(() => {
    if (selectedChapter) unfold(selectedChapter);
  }, [selectedId, selectedChapter]);

  return (
    <nav aria-label="Notes in this section" className="lk-note-list">
      <div className="flex items-stretch gap-1.5">
        <NewNote subjectId={subjectId} chapterId={null} placeholder={placeholder} onCreated={onCreated} id="new-note" />
        {canChapter && !naming && (
          <button type="button" onClick={() => setNaming(true)} className="lk-chapter-add" title="New chapter: a group of notes">
            <FolderPlus size={15} /> <span>Chapter</span>
          </button>
        )}
      </div>
      {naming && (
        <TitleField
          placeholder="Chapter name…"
          label="New chapter name"
          onSave={(title) => {
            setNaming(false);
            if (title) createChapter.mutate({ subjectId, title });
          }}
        />
      )}

      {notes.length === 0 && groups.length === 0 ? (
        <p className="lk-contents-empty">No notes in this section yet. Give the first one a title above.</p>
      ) : (
        <>
          {loose.length > 0 && (
            <ul>
              {loose.map((n) => (
                <NoteRow key={n.id} note={n} selected={n.id === selectedId} href={hrefFor(n.id)} />
              ))}
            </ul>
          )}
          <SortableList ids={groups.map((g) => g.chapter.id)} onReorder={(ids) => reorder.mutate({ ids })}>
            {groups.map(({ chapter, notes: inside }) => (
              <ChapterGroup
                key={chapter.id}
                chapter={chapter}
                notes={inside}
                sectionTitle={sectionTitle}
                open={!folded.has(chapter.id)}
                onToggle={() => folded.toggle(chapter.id)}
                selectedId={selectedId}
                hrefFor={hrefFor}
                onCreated={onCreated}
              />
            ))}
          </SortableList>
        </>
      )}
    </nav>
  );
}

function NoteRow({ note, selected, href }: { note: MilestoneWithTasks; selected: boolean; href: string }) {
  const ago = useAgo();
  const line = excerpt(note.notes, 90);
  const pending = isTempId(note.id);
  return (
    <li>
      <Link
        href={pending ? "#" : href}
        scroll={false}
        aria-current={selected ? "page" : undefined}
        aria-disabled={pending || undefined}
        className={`lk-note-item ${pending ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="lk-note-item-title">{note.title}</span>
        <span className="lk-note-item-line">{line || "Nothing written yet"}</span>
        <span className="lk-note-item-meta">
          {ago(note.updatedAt)}
          {note.tasks.length > 0 && ` · ${note.tasks.length} task${note.tasks.length === 1 ? "" : "s"}`}
        </span>
      </Link>
    </li>
  );
}

function ChapterGroup({
  chapter,
  notes,
  sectionTitle,
  open,
  onToggle,
  selectedId,
  hrefFor,
  onCreated,
}: {
  chapter: Chapter;
  notes: MilestoneWithTasks[];
  sectionTitle: string;
  open: boolean;
  onToggle: () => void;
  selectedId: string | null;
  hrefFor: (noteId: string) => string;
  onCreated: (noteId: string) => void;
}) {
  const pending = isTempId(chapter.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id, disabled: pending });
  const rename = useRenameChapter();
  const del = useDeleteChapter();
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const bodyId = `chapter-${chapter.id}`;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`lk-chapter ${isDragging ? "relative z-10 bg-background shadow-md" : ""}`}
      aria-label={`Chapter: ${chapter.title}`}
    >
      <div className="lk-chapter-head group">
        <button type="button" className="lk-grip" aria-label={`Drag to reorder ${chapter.title}`} disabled={pending} {...attributes} {...listeners}>
          <GripVertical size={13} />
        </button>
        {renaming ? (
          <TitleField
            initial={chapter.title}
            label="Chapter name"
            compact
            onSave={(title) => {
              setRenaming(false);
              if (title && title !== chapter.title) rename.mutate({ id: chapter.id, title });
            }}
          />
        ) : (
          <button type="button" className="lk-chapter-fold" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
            <ChevronRight size={13} className="lk-chapter-chevron" aria-hidden />
            <span className="lk-chapter-title">{chapter.title}</span>
            <span className="lk-chapter-count">{notes.length}</span>
          </button>
        )}
        {!renaming && !pending && (
          <span className="lk-chapter-actions">
            <button
              type="button"
              className="lk-iconbtn"
              title={`New note in ${chapter.title}`}
              aria-label={`New note in ${chapter.title}`}
              onClick={() => {
                if (!open) onToggle();
                setAdding(true);
              }}
            >
              <Plus size={14} />
            </button>
            <button type="button" className="lk-iconbtn" title="Rename" aria-label={`Rename ${chapter.title}`} onClick={() => setRenaming(true)}>
              <Pencil size={13} />
            </button>
            <Popover open={confirming} onOpenChange={setConfirming}>
              <PopoverTrigger asChild>
                <button type="button" className="lk-iconbtn hover:text-destructive" title="Delete chapter" aria-label={`Delete ${chapter.title}`}>
                  <Trash2 size={13} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="flex flex-col gap-3">
                  <div className="lk-sec">Delete this chapter?</div>
                  <p className="text-sm text-muted-foreground">
                    {notes.length > 0
                      ? `Its ${notes.length} note${notes.length === 1 ? "" : "s"} stay in ${sectionTitle}, in no chapter.`
                      : "It has no notes."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      del.mutate(chapter.id);
                    }}
                    className="lk-btn px-3 py-2 text-2xs"
                    style={{ background: "var(--destructive)", borderColor: "var(--destructive)", color: "#fff" }}
                  >
                    Delete chapter
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </span>
        )}
      </div>

      {open && (
        <div id={bodyId} className="lk-chapter-body">
          {adding && (
            <NewNote
              subjectId={chapter.subjectId}
              chapterId={chapter.id}
              placeholder={`New note in ${chapter.title}…`}
              autoFocus
              onCreated={onCreated}
              onDone={() => setAdding(false)}
            />
          )}
          {notes.length > 0 ? (
            <ul>
              {notes.map((n) => (
                <NoteRow key={n.id} note={n} selected={n.id === selectedId} href={hrefFor(n.id)} />
              ))}
            </ul>
          ) : (
            !adding && <p className="lk-chapter-empty">Empty. Add a note with +, or move one here.</p>
          )}
        </div>
      )}
    </section>
  );
}

// The new-note field: at the top for the section, or inside a chapter.
function NewNote({
  subjectId,
  chapterId,
  placeholder,
  onCreated,
  onDone,
  autoFocus,
  id,
}: {
  subjectId: string;
  chapterId: string | null;
  placeholder: string;
  onCreated: (noteId: string) => void;
  onDone?: () => void;
  autoFocus?: boolean;
  id?: string;
}) {
  const create = useCreateMilestone();
  const [title, setTitle] = useState("");
  const fieldId = id ?? `new-note-${chapterId}`;

  // A chapter's field stays until its note is saved: the note opens from the
  // save's callback, which doesn't run once the field has gone.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t || create.isPending) return;
    setTitle("");
    create.mutate(
      { subjectId, title: t, chapterId },
      {
        onSuccess: (m) => {
          onCreated(m.id);
          onDone?.();
        },
        onError: () => setTitle(t),
      },
    );
  };

  return (
    <form onSubmit={submit} className="lk-note-new min-w-0 flex-1">
      <Plus size={15} aria-hidden />
      <label htmlFor={fieldId} className="sr-only">
        New note title
      </label>
      <input
        id={fieldId}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && onDone) {
            e.preventDefault();
            onDone();
          }
        }}
        onBlur={() => {
          if (!title.trim() && !create.isPending) onDone?.();
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
      />
      {title.trim() && (
        <button type="submit" className="lk-btn px-2.5 py-1 text-2xs">
          Add
        </button>
      )}
    </form>
  );
}

// A one-line name: Enter or leaving it saves, Esc keeps what was there.
function TitleField({
  initial = "",
  placeholder,
  label,
  compact,
  onSave,
}: {
  initial?: string;
  placeholder?: string;
  label: string;
  compact?: boolean;
  onSave: (title: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value.trim());
      }}
      className={compact ? "lk-chapter-rename" : "lk-note-new"}
    >
      {!compact && <FolderPlus size={15} aria-hidden />}
      <input
        aria-label={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onSave(initial);
          }
        }}
        onBlur={() => onSave(value.trim())}
        placeholder={placeholder}
        maxLength={120}
        autoComplete="off"
        autoFocus
      />
    </form>
  );
}

// Which chapters are folded, kept in this browser across visits. Read after
// hydration (the server can't know), so a folded chapter folds a frame late
// rather than the page mismatching.
const FOLD_KEY = "lockin.chapters.folded";
const foldListeners = new Set<() => void>();
// Where storage is blocked (private windows), folds last for this visit.
let foldsHere = "";
const readFolds = () => {
  try {
    return localStorage.getItem(FOLD_KEY) ?? foldsHere;
  } catch {
    return foldsHere;
  }
};
const subscribeFolds = (listener: () => void) => {
  foldListeners.add(listener);
  return () => {
    foldListeners.delete(listener);
  };
};
const parseFolds = (raw: string) => new Set(raw.split(",").filter(Boolean));
const writeFolds = (ids: Set<string>) => {
  foldsHere = [...ids].join(",");
  try {
    localStorage.setItem(FOLD_KEY, foldsHere);
  } catch {
    // Blocked storage: foldsHere keeps it for this visit.
  }
  foldListeners.forEach((l) => l());
};
const unfold = (id: string) => {
  const ids = parseFolds(readFolds());
  if (ids.delete(id)) writeFolds(ids);
};

function useFolded() {
  const ids = parseFolds(useSyncExternalStore(subscribeFolds, readFolds, () => ""));
  return {
    has: (id: string) => ids.has(id),
    toggle: (id: string) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFolds(next);
    },
  };
}
