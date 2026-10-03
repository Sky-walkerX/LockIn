"use client";

import Link from "next/link";
import { Link2, MessageSquare, FileText, BookOpen, Eye } from "lucide-react";
import type { ResourceType } from "@/app/generated/prisma/browser";
import { countProgress, type SharedPayload } from "@/lib/share/tree";
import { Markdown } from "@/app/components/subject/markdown";
import { SharedNodeView } from "./shared-node";
import { Wordmark } from "@/app/components/brand/wordmark";
import { BRAND } from "@/lib/brand";

const FALLBACK = "#8b8f9e";

const RESOURCE_ICON: Record<ResourceType, typeof Link2> = {
  LINK: Link2,
  AI_CHAT: MessageSquare,
  PDF: FileText,
  BOOK: BookOpen,
};

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const KIND_LABEL: Record<string, string> = {
  subject: "subject",
  milestone: "note",
  task: "task",
  subtask: "subtask",
};

/** The whole public page body: header, tree, and (for a subject) resources. */
export function SharedView({ payload }: { payload: SharedPayload }) {
  const { root, breadcrumb, resources } = payload;
  const { total, done } = countProgress(root);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="lk-paper min-h-screen px-3 py-6 sm:px-6 sm:py-10">
      <main
        className="lk-subject lk-note-page mx-auto w-full max-w-4xl"
        style={{ "--c": payload.color ?? FALLBACK } as React.CSSProperties}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="lk-display text-lg font-black tracking-tight"
          >
            <Wordmark variant="plain" />
          </Link>
          <span className="lk-print inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-2xs uppercase tracking-wide text-muted-foreground">
            <Eye size={11} /> Shared · view only
          </span>
        </div>

        <header>
          {breadcrumb.length > 0 && (
            <nav className="lk-print mb-2 flex flex-wrap items-center gap-1.5 text-2xs uppercase tracking-wide text-muted-foreground">
              {breadcrumb.map((crumb, i) => (
                <span
                  key={`${crumb}-${i}`}
                  className="flex items-center gap-1.5"
                >
                  {i > 0 && <span aria-hidden>›</span>}
                  <span>{crumb}</span>
                </span>
              ))}
            </nav>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="lk-note-title !my-2">{root.title}</h1>
            <span className="lk-tag">{KIND_LABEL[root.kind]}</span>
          </div>

          {root.notes && (
            <div
              className="lk-reading mt-4 border-t-2 pt-5"
              style={{ borderColor: "var(--c-eff)" }}
            >
              <Markdown page={root.page}>{root.notes}</Markdown>
            </div>
          )}

          {total > 0 && (
            <div className="mt-5 flex items-end gap-4">
              <span className="lk-pct">{pct}%</span>
              <div className="flex-1 pb-1">
                <div className="lk-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div className="lk-print mt-2 text-2xs uppercase tracking-wide text-muted-foreground">
                  {done}/{total} complete
                </div>
              </div>
            </div>
          )}
        </header>

        {root.children.length > 0 && (
          <section className="mt-7">
            <div className="lk-sec mb-3">plan</div>
            <div className="lk-card lk-tree flex flex-col p-2">
              {root.children.map((child) => (
                <SharedNodeView key={child.id} node={child} depth={0} />
              ))}
            </div>
          </section>
        )}

        {resources.length > 0 && (
          <section className="mt-7">
            <div className="lk-sec mb-3">resources · {resources.length}</div>
            <div className="lk-card flex flex-col p-2">
              {resources.map((r) => {
                const Icon = RESOURCE_ICON[r.type];
                return (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <Icon
                      size={14}
                      className="mt-0.5 flex-none text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{r.title}</span>
                      <span className="lk-print block truncate text-2xs text-muted-foreground">
                        {host(r.url)}
                      </span>
                      {r.note && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {r.note}
                        </span>
                      )}
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {root.children.length === 0 &&
          resources.length === 0 &&
          !root.notes && (
            <p className="mt-8 text-sm text-muted-foreground">
              Nothing here yet.
            </p>
          )}

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>
            A read-only page from someone&apos;s {BRAND.name} notebook.
          </span>
          <Link
            href="/"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Start your own notebook
          </Link>
        </footer>
      </main>
    </div>
  );
}
