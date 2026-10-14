"use client";

import type React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAgo, useClock } from "@/app/components/clock";
import type { MilestoneWithTasks, NoteLink } from "@/hooks/useSubjects";
import { useUpdateMilestone } from "@/hooks/useMilestones";
import { shortCommit } from "@/lib/notes/anchor";
import { noteStatus } from "@/lib/notes/status";
import { sourceLabel } from "@/lib/notes/source";
import { pageLabel } from "@/lib/notes/page-label";

// Under a note's provenance: whether it still stands, and the code it's about.
// A replacement, a proposal and an agent's doubt each get one plain line, in
// the pen's blue, since an agent wrote them. Stamp red stays for "Awaiting
// witness". Where both sides of a replacement name their commits, each says
// its commit and date, so the reader sees why the newer page wins.

// A subject page sends an Inbox id on to /inbox itself.
const href = (n: NoteLink) => `/subjects/${n.subjectId}?note=${n.id}`;

function PageLink({ note }: { note: NoteLink }) {
  return (
    <Link href={href(note)} className="lk-status-link">
      {note.page != null ? pageLabel(note.page) : `"${note.title}"`}
    </Link>
  );
}

type CommitRef = Pick<NoteLink, "anchorCommit" | "anchorCommitAt">;

/** "a1b2c3d, 3 Oct 2026" (or as much as is known); null without a commit. */
function useCommitText() {
  const clock = useClock();
  return (n: CommitRef) =>
    n.anchorCommit
      ? `${shortCommit(n.anchorCommit)}${n.anchorCommitAt ? `, ${format(clock.in(n.anchorCommitAt), "d MMM yyyy")}` : ""}`
      : null;
}

/** " (code at 9f8e7d6, 17 Oct 2026)" after a page link, when the linked note has a commit. */
function At({ note, commit }: { note: CommitRef; commit: (n: CommitRef) => string | null }) {
  const text = commit(note);
  return text ? <> (code at <code>{text}</code>)</> : null;
}

const DAY = 86_400_000;

/**
 * Why the replacement wins, when both commits are dated: its code is that
 * much later. A replacement written at older code says so instead, since the
 * agent may have been on a stale checkout.
 */
function CommitGap({ newer, older }: { newer: CommitRef; older: CommitRef }) {
  if (!newer.anchorCommitAt || !older.anchorCommitAt) return null;
  const gap = new Date(newer.anchorCommitAt).getTime() - new Date(older.anchorCommitAt).getTime();
  if (gap < 0) return <b>This page&apos;s commit is older than the one it replaces. Check it before you witness.</b>;
  const days = Math.round(gap / DAY);
  return <>This page describes code {days === 0 ? "from later the same day" : `${days} day${days === 1 ? "" : "s"} newer`}.</>;
}

export function NoteStatus({ note }: { note: MilestoneWithTasks }) {
  const ago = useAgo();
  const clock = useClock();
  const commit = useCommitText();
  const update = useUpdateMilestone();
  const status = noteStatus({ ...note, supersededBy: note.supersededBy ?? [] });
  const answer = (stale: "checked" | "dismissed") => update.mutate({ id: note.id, data: { stale } });

  const lines: React.ReactNode[] = [];
  if (status.kind === "replaced") {
    lines.push(
      <p key="s" className="lk-status lk-status-strong">
        <b>Replaced</b> by <PageLink note={status.by} />
        <At note={status.by} commit={commit} />. This page is history: search and Ask use the newer one.
      </p>,
    );
  } else if (status.kind === "proposed") {
    lines.push(
      <p key="s" className="lk-status">
        <b>{sourceLabel(status.by.source)}</b> wrote a replacement, <PageLink note={status.by} />
        <At note={status.by} commit={commit} />. Witness it there to retire this page.
      </p>,
    );
  } else if (status.kind === "stale") {
    lines.push(
      <div key="s" className="lk-status lk-status-strong" role="status">
        <p>
          <b>{sourceLabel(status.by)}</b> thinks this may be out of date{status.at ? ` (${ago(status.at)})` : ""}: {status.reason}
        </p>
        <div className="lk-status-actions">
          <button type="button" className="lk-note-bar-btn" onClick={() => answer("checked")} disabled={update.isPending}>
            Still true
          </button>
          <button type="button" className="lk-note-bar-btn" onClick={() => answer("dismissed")} disabled={update.isPending}>
            Dismiss
          </button>
        </div>
      </div>,
    );
  }
  if (note.supersedes) {
    lines.push(
      <p key="r" className="lk-status">
        Replaces <PageLink note={note.supersedes} />
        <At note={note.supersedes} commit={commit} />. <CommitGap newer={note} older={note.supersedes} />
      </p>,
    );
  }
  if (note.anchorRepo || note.anchorCommit) {
    const files = note.anchorFiles.length;
    lines.push(
      <p key="c" className="lk-anchor" title={note.anchorFiles.join("\n") || undefined}>
        <span className="lk-anchor-label">Code</span>
        {note.anchorRepo ?? "repo"}
        {note.anchorCommit ? <> @ <code>{shortCommit(note.anchorCommit)}</code></> : null}
        {note.anchorCommit && note.anchorCommitAt ? ` · committed ${format(clock.in(note.anchorCommitAt), "d MMM yyyy")}` : ""}
        {files > 0 ? ` · ${files} file${files === 1 ? "" : "s"}` : ""}
        {note.checkedAt ? ` · checked ${ago(note.checkedAt)}` : ""}
      </p>,
    );
  }
  return lines.length ? <div className="lk-note-status">{lines}</div> : null;
}
