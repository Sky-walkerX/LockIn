"use client";

import Link from "next/link";
import { ago } from "@/lib/dates";
import { useRecentNotes } from "@/hooks/useNotes";
import { Skeleton } from "@/app/components/ui/skeleton";

// The notebook's contents page: notes across every section, most recently
// written first. Each row opens the note where it lives.
export function Contents() {
  const { data: notes, isLoading, isError } = useRecentNotes(14);

  return (
    <section aria-labelledby="contents-h" className="lk-contents">
      <div className="lk-contents-head" aria-hidden>
        <span>Entry</span>
        <span>Section</span>
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
            href={`/subjects/${n.subject.id}?note=${n.id}`}
            className="lk-contents-row lk-subject group"
            style={{ "--c": n.subject.color ?? "var(--muted-foreground)" } as React.CSSProperties}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="lk-contents-title">{n.title}</span>
              </div>
              {n.excerpt && <div className="lk-contents-excerpt">{n.excerpt}</div>}
            </div>
            <span className="lk-contents-section">
              <i className="lk-tab-chip" style={{ background: "var(--c-eff)" }} aria-hidden />
              <span className="truncate">{n.subject.title}</span>
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
