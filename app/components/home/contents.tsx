"use client";

import Link from "next/link";
import { ago } from "@/lib/dates";
import { useRecentNotes } from "@/hooks/useNotes";
import { Skeleton } from "@/app/components/ui/skeleton";
import { awaitingWitness, isOwnNote, sourceLabel } from "@/lib/notes/source";
import { CONTENTS_RECENT_NOTES } from "@/lib/query-keys";

// The notebook's contents page: notes across every section, most recently
// written first. Each row opens the note where it lives.
export function Contents() {
  const { data: notes, isLoading, isError } = useRecentNotes(CONTENTS_RECENT_NOTES);

  return (
    <section aria-labelledby="contents-h" className="lk-contents">
      <div className="lk-contents-head" aria-hidden>
        <span>Entry</span>
        <span>Section</span>
        <span>Plan</span>
        <span className="text-right">Written</span>
      </div>

      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="lk-contents-row">
            <div className="grid gap-1.5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
            <Skeleton className="h-3.5 w-24" />
            <span />
            <Skeleton className="ml-auto h-3.5 w-16" />
          </div>
        ))
      ) : isError ? (
        <p className="lk-contents-empty">The contents didn&apos;t load. Refresh the page to try again.</p>
      ) : notes && notes.length > 0 ? (
        notes.map((n) => (
          <Link
            key={n.id}
            href={n.subject.isInbox ? `/inbox?note=${n.id}` : `/subjects/${n.subject.id}?note=${n.id}`}
            className="lk-contents-row lk-subject group"
            style={{ "--c": n.subject.color ?? "var(--muted-foreground)" } as React.CSSProperties}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="lk-contents-title">{n.title}</span>
                {awaitingWitness(n) && <span className="lk-stamp flex-none">Awaiting witness</span>}
              </div>
              {(n.excerpt || !isOwnNote(n.source)) && (
                <div className="lk-contents-excerpt">
                  {!isOwnNote(n.source) && <span className="text-foreground/80">via {sourceLabel(n.source)}</span>}
                  {!isOwnNote(n.source) && n.excerpt && " · "}
                  {n.excerpt}
                </div>
              )}
            </div>
            <span className="lk-contents-section">
              {n.subject.isInbox ? null : <i className="lk-tab-chip" style={{ background: "var(--c-eff)" }} aria-hidden />}
              <span className="truncate">{n.subject.title}</span>
            </span>
            <span className="lk-contents-meta">
              {n.taskCount > 0 ? `${n.taskCount} task${n.taskCount === 1 ? "" : "s"}` : ""}
            </span>
            <time className="lk-contents-meta text-right" dateTime={n.updatedAt}>
              {ago(n.updatedAt)}
            </time>
          </Link>
        ))
      ) : (
        <p className="lk-contents-empty">
          No notes yet. Open a section from the spine and write the first one.
        </p>
      )}
    </section>
  );
}
