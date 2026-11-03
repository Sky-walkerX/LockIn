"use client";

import { QueryLink } from "@/app/components/query-link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, FolderPlus, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useAgo } from "@/app/components/clock";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import type { Chapter } from "@/app/generated/prisma/browser";
import { useCreateMilestone, useReorderMilestones } from "@/hooks/useMilestones";
import { useCreateChapter, useDeleteChapter, useRenameChapter, useReorderChapters } from "@/hooks/useChapters";
import { SortableList } from "@/app/components/subject/sortable-list";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { isTempId } from "@/lib/subject-cache";
import { excerpt } from "@/lib/notes/excerpt";
import { groupByChapter, withGroupOrder } from "@/lib/notes/chapters";

// A section's notes in their order, with a line of each: the ones in no
// chapter first, then each chapter under a heading that folds. The new-note
// field sits on top: a title is enough to start, and the note opens ready to
// write. A chapter can take a new note of its own, be renamed, dragged into
// another place, or removed (its notes stay in the section). Notes drag into
// a new place within their own group; Move files one in another chapter.
// Chapters start closed, and the ones opened stay open across visits.
export function NoteList({
  subjectId,
  sectionTitle,
  notes,
  chapters,
  selectedId,
  revealId = null,
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
  /** The note asked for by the address, as opposed to the one shown by default. */
  revealId?: string | null;
  hrefFor: (noteId: string) => string;
  onCreated: (noteId: string) => void;
  placeholder?: string;
}) {
  const canChapter = chapters !== undefined;
  const createChapter = useCreateChapter();
  const reorder = useReorderChapters();
  const reorderNotes = useReorderMilestones();
  const [naming, setNaming] = useState(false);
  const opened = useOpenChapters();
  const { loose, groups } = groupByChapter(notes, chapters ?? []);
  const revealChapter = notes.find((n) => n.id === revealId)?.chapterId ?? null;
  // A group's new order, written into the whole section's: every note's order
  // becomes its place in reading order.
  const inReadingOrder = [...loose, ...groups.flatMap((g) => g.notes)].map((n) => n.id);
  const reorderGroup = (group: string[]) => reorderNotes.mutate({ ids: withGroupOrder(inReadingOrder, group) });

  // Being taken to a note (by Go to, leaving Zen, a link from another page)
  // opens its chapter so it can be seen, and it stays open. Not the note shown
  // by default, and not a reload: that keeps the chapters as they were left.
  const seenReveal = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const first = seenReveal.current === undefined;
    if (revealId === seenReveal.current) return;
    seenReveal.current = revealId;
    if (first && loadedHere()) return;
    if (revealChapter) openChapter(revealChapter);
  }, [revealId, revealChapter]);

  return (
    <nav aria-label="Notes in this section" className="lk-note-list">
      <div className="flex items-stretch gap-1.5">
        <NewNote subjectId={subjectId} chapterId={null} placeholder={placeholder} onCreated={onCreated} id="new-note" />
        {canChapter && !naming && (
          <button type="button" onClick={() => setNaming(true)} className="lk-chapter-add" title="New chapter: a group of notes" aria-label="New chapter">
            <FolderPlus size={15} aria-hidden /> <span>Chapter</span>
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
            <SortableList ids={loose.map((n) => n.id)} onReorder={reorderGroup}>
              <ul>
                {loose.map((n) => (
                  <NoteRow key={n.id} note={n} selected={n.id === selectedId} href={hrefFor(n.id)} />
                ))}
              </ul>
            </SortableList>
          )}
          <SortableList ids={groups.map((g) => g.chapter.id)} onReorder={(ids) => reorder.mutate({ ids })}>
            {groups.map(({ chapter, notes: inside }) => (
              <ChapterGroup
                key={chapter.id}
                chapter={chapter}
                notes={inside}
                sectionTitle={sectionTitle}
                open={opened.has(chapter.id)}
                onToggle={() => opened.toggle(chapter.id)}
                onReorderNotes={reorderGroup}
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

// A mouse drags a row from anywhere on it (a click still opens the note). The
// grip is for the keyboard, and for touch, where dragging the row scrolls.
function NoteRow({ note, selected, href }: { note: MilestoneWithTasks; selected: boolean; href: string }) {
  const ago = useAgo();
  const line = excerpt(note.notes, 90);
  const pending = isTempId(note.id);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: pending,
  });
  // dnd-kit types its listeners loosely; these are the sensors' React handlers.
  const { onKeyDown, ...pointer } = (listeners ?? {}) as Record<string, React.EventHandler<React.SyntheticEvent>>;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`lk-note-row ${isDragging ? "z-10 bg-background shadow-md" : ""}`}
      {...pointer}
    >
      <QueryLink
        href={pending ? "#" : href}
        scroll={false}
        draggable={false}
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
      </QueryLink>
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="lk-grip"
        aria-label={`Drag to reorder ${note.title}`}
        disabled={pending}
        {...attributes}
        onKeyDown={onKeyDown}
      >
        <GripVertical size={13} />
      </button>
    </li>
  );
}

function ChapterGroup({
  chapter,
  notes,
  sectionTitle,
  open,
  onToggle,
  onReorderNotes,
  selectedId,
  hrefFor,
  onCreated,
}: {
  chapter: Chapter;
  notes: MilestoneWithTasks[];
  sectionTitle: string;
  open: boolean;
  onToggle: () => void;
  onReorderNotes: (ids: string[]) => void;
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
            <SortableList ids={notes.map((n) => n.id)} onReorder={onReorderNotes}>
              <ul>
                {notes.map((n) => (
                  <NoteRow key={n.id} note={n} selected={n.id === selectedId} href={hrefFor(n.id)} />
                ))}
              </ul>
            </SortableList>
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

// Which chapters are open, kept in this browser across visits; any other is
// closed. Read after hydration (the server can't know), so an open chapter
// opens a frame late rather than the page mismatching.
const OPEN_KEY = "lockin.chapters.open";
const openListeners = new Set<() => void>();
// Where storage is blocked (private windows), what's open lasts for this visit.
let openHere = "";
const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) ?? openHere;
  } catch {
    return openHere;
  }
};
const subscribeOpen = (listener: () => void) => {
  openListeners.add(listener);
  return () => {
    openListeners.delete(listener);
  };
};
const parseOpen = (raw: string) => new Set(raw.split(",").filter(Boolean));
const writeOpen = (ids: Set<string>) => {
  openHere = [...ids].join(",");
  try {
    localStorage.setItem(OPEN_KEY, openHere);
  } catch {
    // Blocked storage: openHere keeps it for this visit.
  }
  openListeners.forEach((l) => l());
};
const openChapter = (id: string) => {
  const ids = parseOpen(readOpen());
  if (!ids.has(id)) writeOpen(ids.add(id));
};

/** Whether this page is the one the browser loaded (or reloaded), rather than one reached inside the app. */
function loadedHere(): boolean {
  const entry = performance.getEntriesByType("navigation")[0];
  return !!entry && entry.name === window.location.href;
}

function useOpenChapters() {
  const ids = parseOpen(useSyncExternalStore(subscribeOpen, readOpen, () => ""));
  return {
    has: (id: string) => ids.has(id),
    toggle: (id: string) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeOpen(next);
    },
  };
}
