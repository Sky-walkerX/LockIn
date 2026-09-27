"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSubject } from "@/hooks/useSubjects";
import { SubjectHeader } from "@/app/components/subject/subject-header";
import { NoteList } from "@/app/components/note/note-list";
import { NoteView } from "@/app/components/note/note-view";
import { Skeleton } from "@/app/components/ui/skeleton";

const FALLBACK = "#8b8f9e";

// The URL carries the note being read: ?note=<id>.
export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession({ required: true });
  const { data: subject, isLoading, isError } = useSubject(id);

  const noteParam = searchParams.get("note");

  const href = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v) next.set(k, v);
      const qs = next.toString();
      return `/subjects/${id}${qs ? `?${qs}` : ""}`;
    },
    [id],
  );

  // A freshly created note opens in the editor.
  const [justCreated, setJustCreated] = useState<string | null>(null);

  if (status === "loading" || isLoading) {
    return (
      <main className="lk-page">
        <Skeleton className="h-[58px] w-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </main>
    );
  }

  if (isError || !subject) {
    return (
      <main className="lk-page">
        <h1 className="lk-page-title">Section not found</h1>
        <p className="lk-page-sub">It may have been deleted, or the link is from another account.</p>
        <Link href="/" className="lk-btn w-fit px-3 py-2 text-2xs">
          Back to contents
        </Link>
      </main>
    );
  }

  const notes = subject.milestones;
  const selected = notes.find((n) => n.id === noteParam) ?? null;
  // Wide screens always show a page: the requested note, else the most recently
  // written one. Phones show the list until a note is picked.
  const shown =
    selected ??
    (notes.length > 0
      ? [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null);

  return (
    <main className="lk-page lk-subject" style={{ "--c": subject.color ?? FALLBACK } as React.CSSProperties}>
      <SubjectHeader subject={subject} />

      <div className="lk-notes-pane" data-has-note={selected ? "" : undefined}>
        <NoteList
          subjectId={subject.id}
          notes={notes}
          selectedId={shown?.id ?? null}
          hrefFor={(noteId) => href({ note: noteId })}
          onCreated={(noteId) => {
            setJustCreated(noteId);
            router.replace(href({ note: noteId }), { scroll: false });
          }}
        />
        {shown ? (
          <NoteView
            key={shown.id}
            note={shown}
            sectionTitle={subject.title}
            backHref={href({})}
            startEditing={justCreated === shown.id}
            onDeleted={() => router.replace(href({}), { scroll: false })}
          />
        ) : (
          <div className="lk-note-page lk-note-empty">
            <p>This section has no notes yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}

