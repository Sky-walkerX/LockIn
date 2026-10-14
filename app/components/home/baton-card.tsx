"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useAgo } from "@/app/components/clock";
import { CopyButton } from "@/app/components/settings/agent-connections";
import { useCloseHandoff, useHandoffs, type HandoffRow } from "@/hooks/useHandoffs";
import { sourceLabel } from "@/lib/notes/source";
import { pageLabel } from "@/lib/notes/page-label";
import { repoName } from "@/lib/notes/anchor";

// Batons agents left for each other: an unfinished piece of work, written for
// whoever carries on in another tool or a new session. The open ones show on
// the home page with the command that picks them up; the last few taken sit
// under them. With none at all it renders nothing.

/** What names the baton to /lockin:pickup: its subject, else its repo. */
function pickupArg(h: HandoffRow): string {
  if (h.subject && !h.subject.isInbox) return h.subject.title;
  return h.repo ? repoName(h.repo) : "";
}

function Open({ h }: { h: HandoffRow }) {
  const ago = useAgo();
  const close = useCloseHandoff();
  const arg = pickupArg(h);
  const where = [h.subject && !h.subject.isInbox ? h.subject.title : null, h.repo, h.branch].filter(Boolean).join(" · ");
  return (
    <li className="lk-baton">
      <div className="flex items-start justify-between gap-3">
        <p className="lk-baton-from">
          <b>{sourceLabel(h.source)}</b> handed this on {ago(h.createdAt)}
          {where ? <span className="text-muted-foreground"> · {where}</span> : null}
        </p>
        <button
          type="button"
          className="lk-iconbtn"
          onClick={() => close.mutate(h.id)}
          aria-label="Close this baton"
          title="Close it: nobody needs to pick it up"
        >
          <X size={14} />
        </button>
      </div>
      <p className="lk-baton-goal">{h.goal}</p>
      <dl className="lk-baton-fields">
        <dt>Stands</dt>
        <dd>{h.state}</dd>
        {h.tried.length > 0 && (
          <>
            <dt>Ruled out</dt>
            <dd>{h.tried.join(" · ")}</dd>
          </>
        )}
        <dt>Next</dt>
        <dd>
          {h.next}
          {h.nextAt ? <code className="ml-2">{h.nextAt}</code> : null}
        </dd>
        {(h.pages.length > 0 || h.task) && (
          <>
            <dt>Read</dt>
            <dd>
              {h.pages.map((p) => pageLabel(p)).join(", ")}
              {h.task && h.subject ? (
                <>
                  {h.pages.length > 0 ? " · " : ""}
                  <Link href={`/subjects/${h.subject.id}?open=task:${h.task.id}`} className="underline underline-offset-4">
                    {h.task.title}
                  </Link>
                </>
              ) : null}
            </dd>
          </>
        )}
      </dl>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <code className="lk-baton-cmd">/lockin:pickup{arg ? ` ${arg}` : ""}</code>
        <CopyButton value={`/lockin:pickup${arg ? ` ${arg}` : ""}`} label="Copy" />
        <span className="text-sm text-muted-foreground">In another agent, ask it to pick up the LockIn baton{arg ? ` for ${arg}` : ""}.</span>
      </div>
    </li>
  );
}

export function BatonCard() {
  const ago = useAgo();
  const { data = [] } = useHandoffs();
  const open = data.filter((h) => h.status === "OPEN");
  const taken = data.filter((h) => h.status === "PICKED_UP").slice(0, 4);
  if (open.length === 0 && taken.length === 0) return null;
  return (
    <section aria-label="Batons" className="lk-hero px-4 py-3">
      <div className="mb-1.5 flex items-baseline gap-3">
        <h2 className="lk-sec !text-foreground">Batons</h2>
        <span className="text-sm text-muted-foreground">
          {open.length > 0 ? `${open.length} waiting to be picked up` : "Nothing waiting"}
        </span>
      </div>
      {open.length > 0 && (
        <ul className="grid">
          {open.map((h) => (
            <Open key={h.id} h={h} />
          ))}
        </ul>
      )}
      {taken.length > 0 && (
        <details className="lk-baton-history">
          <summary>Picked up lately</summary>
          <ul>
            {taken.map((h) => (
              <li key={h.id}>
                {h.goal}
                <span className="text-muted-foreground">
                  {" "}
                  · {sourceLabel(h.source)} to {h.pickedUpBy === "web" ? "closed by you" : sourceLabel(h.pickedUpBy)}
                  {h.pickedUpAt ? `, ${ago(h.pickedUpAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
