"use client";

import Link from "next/link";
import { useAttention } from "@/hooks/useHandoffs";
import { sourceLabel } from "@/lib/notes/source";
import { pageLabel } from "@/lib/notes/page-label";

// What agents asked the user to look at: a note one flagged as possibly out
// of date, or a replacement one wrote that retires an old page once the user
// witnesses it. Each row opens the note, where the answer is one click. With
// nothing to look at it renders nothing.

const page = (n: { page: number | null; title: string }) => (n.page != null ? `${pageLabel(n.page)} · ${n.title}` : n.title);

export function NeedsALook() {
  const { data } = useAttention();
  const flagged = data?.flagged ?? [];
  const proposals = data?.proposals ?? [];
  const count = flagged.length + proposals.length;
  if (count === 0) return null;
  return (
    <section aria-label="Needs a look" className="lk-hero px-4 py-3">
      <div className="mb-1.5 flex items-baseline gap-3">
        <h2 className="lk-sec !text-foreground">Needs a look</h2>
        <span className="text-sm text-muted-foreground">
          {count} note{count === 1 ? "" : "s"} an agent asked about
        </span>
      </div>
      <ul className="grid">
        {proposals.map((n) => (
          <li key={n.id} className="border-t border-border py-1.5 first:border-t-0">
            <Link href={`/subjects/${n.subject.id}?note=${n.id}`} className="font-reading text-base hover:underline">
              {page(n)}
            </Link>
            <span className="text-sm text-muted-foreground">
              {" "}
              · {sourceLabel(n.source)} wrote it to replace {n.supersedes ? page(n.supersedes) : "an older page"}. Witness it to retire the old one.
            </span>
          </li>
        ))}
        {flagged.map((n) => (
          <li key={n.id} className="border-t border-border py-1.5 first:border-t-0">
            <Link href={`/subjects/${n.subject.id}?note=${n.id}`} className="font-reading text-base hover:underline">
              {page(n)}
            </Link>
            <span className="text-sm text-muted-foreground">
              {" "}
              · {sourceLabel(n.staleBy)} thinks it may be out of date: {n.staleReason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
