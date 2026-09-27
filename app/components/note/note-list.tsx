"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ago } from "@/lib/dates";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { useCreateMilestone } from "@/hooks/useMilestones";
import { isTempId } from "@/lib/subject-cache";
import { excerpt } from "@/lib/notes/excerpt";

// A section's notes in their order, with a line of each. The new-note field
// sits on top: a title is enough to start, and the note opens ready to write.
export function NoteList({
  subjectId,
  notes,
  selectedId,
  hrefFor,
  onCreated,
  placeholder = "New note…",
}: {
  subjectId: string;
  notes: MilestoneWithTasks[];
  selectedId: string | null;
  hrefFor: (noteId: string) => string;
  onCreated: (noteId: string) => void;
  placeholder?: string;
}) {
  const create = useCreateMilestone();
  const [title, setTitle] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle("");
    create.mutate({ subjectId, title: t }, { onSuccess: (m) => onCreated(m.id), onError: () => setTitle(t) });
  };

  return (
    <nav aria-label="Notes in this section" className="lk-note-list">
      <form onSubmit={submit} className="lk-note-new">
        <Plus size={15} aria-hidden />
        <label htmlFor="new-note" className="sr-only">
          New note title
        </label>
        <input
          id="new-note"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {title.trim() && (
          <button type="submit" className="lk-btn px-2.5 py-1 text-2xs">
            Add
          </button>
        )}
      </form>

      {notes.length === 0 ? (
        <p className="lk-contents-empty">No notes in this section yet. Give the first one a title above.</p>
      ) : (
        <ul>
          {notes.map((n) => {
            const line = excerpt(n.notes, 90);
            const pending = isTempId(n.id);
            return (
              <li key={n.id}>
                <Link
                  href={pending ? "#" : hrefFor(n.id)}
                  scroll={false}
                  aria-current={n.id === selectedId ? "page" : undefined}
                  aria-disabled={pending || undefined}
                  className={`lk-note-item ${pending ? "pointer-events-none opacity-60" : ""}`}
                >
                  <span className="lk-note-item-title">{n.title}</span>
                  <span className="lk-note-item-line">{line || "Nothing written yet"}</span>
                  <span className="lk-note-item-meta">
                    {ago(n.updatedAt)}
                    {n.tasks.length > 0 && ` · ${n.tasks.length} task${n.tasks.length === 1 ? "" : "s"}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
