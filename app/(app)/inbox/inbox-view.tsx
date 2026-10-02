"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useInbox } from "@/hooks/useInbox";
import { useSubject } from "@/hooks/useSubjects";
import { RuledBoxes } from "@/app/components/notebook/ruled-boxes";
import { NoteList } from "@/app/components/note/note-list";
import { NoteView } from "@/app/components/note/note-view";
import { Skeleton } from "@/app/components/ui/skeleton";

// Notes that aren't filed under a section yet: quick captures from "New note",
// and whatever an agent saves without naming a subject. Same two panes as a
// section's Notes tab, with Move doing the filing.
export function InboxView() {
  // useSearchParams on a static route needs a boundary to render around.
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}

function Inbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession({ required: true });
  const { data: inbox, isError: inboxError } = useInbox(status === "authenticated");
  const { data: subject, isLoading } = useSubject(inbox?.id);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const noteParam = searchParams.get("note");

  // "New note" (spine or phone bar) lands here with ?new=1: focus the field,
  // then drop the flag so the next click focuses it again.
  const wantsNew = searchParams.get("new") === "1";
  const ready = !!subject;
  useEffect(() => {
    if (!wantsNew || !ready) return;
    document.getElementById("new-note")?.focus();
    router.replace(noteParam ? `/inbox?note=${noteParam}` : "/inbox", { scroll: false });
  }, [wantsNew, ready, noteParam, router]);
  const href = useCallback((note: string | null) => (note ? `/inbox?note=${note}` : "/inbox"), []);

  if (inboxError) {
    return (
      <main className="lk-page">
        <h1 className="lk-page-title">Inbox</h1>
        <p className="lk-page-sub">The Inbox didn&apos;t load. Refresh the page to try again.</p>
      </main>
    );
  }
  if (status === "loading" || !inbox || isLoading || !subject) {
    return (
      <main className="lk-page">
        <Skeleton className="h-[58px] w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  const notes = subject.milestones;
  const selected = notes.find((n) => n.id === noteParam) ?? null;
  const shown =
    selected ??
    (notes.length > 0
      ? [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null);

  return (
    <main className="lk-page">
      <RuledBoxes
        items={[
          { label: "Tray", value: "Inbox", grow: 2 },
          { label: "Unfiled", value: notes.length },
          { label: "To witness", value: inbox.awaiting },
          { label: "Date", value: format(new Date(), "d MMM yyyy"), grow: 1.3 },
        ]}
      />
      <header>
        <h1 className="lk-page-title">Inbox</h1>
        <p className="lk-page-sub">
          {notes.length === 0
            ? "Nothing waiting to be filed. Quick notes and anything an agent saves without a section land here."
            : "Notes that aren't filed yet. Read one, then move it under a section."}
        </p>
      </header>

      <div className="lk-notes-pane" data-has-note={selected ? "" : undefined}>
        <NoteList
          subjectId={subject.id}
          notes={notes}
          selectedId={shown?.id ?? null}
          hrefFor={(id) => href(id)}
          placeholder="Quick note title…"
          onCreated={(id) => {
            setJustCreated(id);
            router.replace(href(id), { scroll: false });
          }}
        />
        {shown ? (
          <NoteView
            key={shown.id}
            note={shown}
            sectionTitle="Inbox"
            planHref={null}
            backHref={href(null)}
            startEditing={justCreated === shown.id}
            onDeleted={() => router.replace(href(null), { scroll: false })}
            onMoved={() => router.replace(href(null), { scroll: false })}
          />
        ) : (
          <div className="lk-note-page lk-note-empty">
            <p>The tray is empty.</p>
          </div>
        )}
      </div>
    </main>
  );
}
