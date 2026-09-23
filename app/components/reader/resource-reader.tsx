"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Highlighter, Loader2, Sparkles, X } from "lucide-react";
import { api } from "@/lib/fetcher";
import { appendNote } from "@/lib/notes/append";
import { findSection, splitSections } from "@/lib/reader/sections";
import { useIngestResource, useResourceContent } from "@/hooks/useResources";
import type { SubjectDetail } from "@/hooks/useSubjects";
import { Markdown } from "@/app/components/subject/markdown";

// How many sections render up front, and how many more each time the reader
// scrolls near the end of what's rendered.
const BATCH = 4;
const lastTargetKey = (subjectId: string) => `lockin.reader.target.${subjectId}`;

type Selection = { text: string; top: number; left: number };

/**
 * A resource read inside LockIn: its extracted text (rendered a few sections
 * at a time), or the original PDF. Selecting text offers to file it as a quote
 * into one of the subject's milestone notes.
 */
export function ResourceReader({
  resourceId,
  subject,
  passage,
  onClose,
}: {
  resourceId: string;
  subject: SubjectDetail;
  /** Scroll to the section containing this text (a search hit's snippet). */
  passage: string | null;
  onClose: () => void;
}) {
  const { data: resource, isLoading, isError } = useResourceContent(resourceId);
  const ingest = useIngestResource();
  const hasText = !!resource?.extracted?.trim();
  const isPdf = resource?.type === "PDF";
  const [tab, setTab] = useState<"text" | "original">("text");
  const view = hasText ? tab : isPdf ? "original" : "text";

  const sections = useMemo(() => (resource?.extracted ? splitSections(resource.extracted) : []), [resource?.extracted]);
  const targetIndex = useMemo(() => (passage ? findSection(sections, passage) : -1), [sections, passage]);
  const [shown, setShown] = useState(BATCH);
  const visible = Math.max(shown, targetIndex + 2);

  // Esc closes, and the page behind doesn't scroll while the reader is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Render more as the end of the rendered text comes into view.
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visible >= sections.length) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShown((n) => Math.max(n, visible) + BATCH),
      { root: scrollRef.current, rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, sections.length, view]);

  // Jump to the section a search hit pointed at, once it has rendered.
  const [found, setFound] = useState(false);
  useEffect(() => {
    if (targetIndex < 0 || view !== "text") return;
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-section="${targetIndex}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    setFound(true);
  }, [targetIndex, view, sections.length]);

  // Highlight -> notes
  const [selection, setSelection] = useState<Selection | null>(null);
  const onMouseUp = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    const root = scrollRef.current;
    if (!sel || !text || sel.rangeCount === 0 || !root || !root.contains(sel.anchorNode)) {
      setSelection(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const box = root.getBoundingClientRect();
    setSelection({
      text,
      top: rect.bottom - box.top + root.scrollTop + 6,
      left: Math.min(Math.max(rect.left - box.left, 8), box.width - 220),
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[55] flex justify-end bg-black/40 backdrop-blur-[1px]" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={resource ? `Reading ${resource.title}` : "Reader"}
        className="flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="lk-display truncate text-lg font-bold">{resource?.title ?? "Loading…"}</div>
            {resource && (
              <div className="lk-mono mt-0.5 flex items-center gap-2 text-[10.5px] uppercase tracking-wide text-muted-foreground">
                <span className="lk-tag">{resource.type.toLowerCase().replace("_", " ")}</span>
                {resource.pageCount ? <span>{resource.pageCount} pages</span> : null}
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 normal-case tracking-normal hover:text-foreground"
                >
                  Open original <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
          {hasText && isPdf && (
            <div className="flex gap-1" role="tablist">
              {(["text", "original"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={view === t}
                  onClick={() => setTab(t)}
                  className={`lk-mono rounded-md border px-2.5 py-1 text-[10px] uppercase tracking-wide ${
                    view === t ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={onClose} className="lk-iconbtn" title="Close (Esc)">
            <X size={16} />
          </button>
        </header>

        {isLoading ? (
          <p className="lk-mono p-6 text-sm text-muted-foreground">loading…</p>
        ) : isError || !resource ? (
          <p className="p-6 text-sm text-muted-foreground">This resource couldn&apos;t be loaded.</p>
        ) : view === "original" ? (
          // The browser's own PDF viewer. If the storage host ever refuses to be
          // framed, "Open original" above still works.
          <iframe src={resource.url} title={resource.title} className="h-full w-full flex-1 border-0 bg-white" />
        ) : !hasText ? (
          <div className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm text-muted-foreground">
              {resource.ingestState === "FAILED"
                ? `Text extraction failed${resource.ingestError ? `: ${resource.ingestError}` : "."}`
                : resource.type === "AI_CHAT"
                  ? "Chat links can't be read here. Open the original instead."
                  : "No text has been extracted from this resource yet."}
            </p>
            {resource.type !== "AI_CHAT" && (
              <button
                type="button"
                onClick={() => ingest.mutate(resource.id)}
                disabled={ingest.isPending}
                className="lk-btn flex items-center gap-2 px-3 py-2 text-[10.5px] disabled:opacity-50"
              >
                {ingest.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {ingest.isPending ? "Extracting…" : "Extract text"}
              </button>
            )}
          </div>
        ) : (
          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 py-5" onMouseUp={onMouseUp}>
            {sections.slice(0, visible).map((section, i) => (
              <div
                key={i}
                data-section={i}
                className={`mb-4 rounded-md ${found && i === targetIndex ? "lk-found" : ""}`}
              >
                <Markdown highlight={false}>{section}</Markdown>
              </div>
            ))}
            {visible < sections.length && (
              <div ref={sentinelRef} className="lk-mono py-4 text-center text-[11px] text-muted-foreground">
                loading more…
              </div>
            )}
            {selection && (
              <HighlightToNote
                selection={selection}
                subject={subject}
                source={{ title: resource.title, url: resource.url }}
                onDone={() => {
                  setSelection(null);
                  window.getSelection()?.removeAllRanges();
                }}
              />
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function HighlightToNote({
  selection,
  subject,
  source,
  onDone,
}: {
  selection: Selection;
  subject: SubjectDetail;
  source: { title: string; url: string };
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const milestones = subject.milestones;
  const [target, setTarget] = useState(() => {
    try {
      const last = localStorage.getItem(lastTargetKey(subject.id));
      if (last && milestones.some((m) => m.id === last)) return last;
    } catch {}
    return milestones[0]?.id ?? "";
  });
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  const save = async () => {
    if (!target) return;
    setState("saving");
    try {
      // Read the note fresh, not from cache, so an edit made elsewhere since
      // the page loaded isn't overwritten.
      const fresh = await api.get<SubjectDetail>(`/api/subjects/${subject.id}`);
      const existing = fresh.milestones.find((m) => m.id === target)?.notes ?? "";
      const quote = selection.text
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n");
      const notes = appendNote(existing, `${quote}\n\n— [${source.title}](${source.url})`, "highlight");
      await api.put(`/api/milestones/${target}`, { notes });
      try {
        localStorage.setItem(lastTargetKey(subject.id), target);
      } catch {}
      await qc.invalidateQueries({ queryKey: ["subject", subject.id] });
      onDone();
    } catch {
      setState("error");
    }
  };

  return (
    <div
      className="lk-card absolute z-10 flex w-[220px] flex-col gap-2 p-2.5"
      style={{ top: selection.top, left: selection.left }}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {milestones.length === 0 ? (
        <p className="text-xs text-muted-foreground">Add a milestone to keep highlights in its notes.</p>
      ) : (
        <>
          <label className="lk-mono flex flex-col gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Add to notes of
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs normal-case tracking-normal text-foreground"
            >
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={save}
            disabled={state === "saving"}
            className="lk-btn flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10.5px] disabled:opacity-50"
          >
            <Highlighter size={12} /> {state === "saving" ? "Saving…" : "Add highlight"}
          </button>
          {state === "error" && <p className="text-[11px] text-destructive">Couldn&apos;t save. Try again.</p>}
        </>
      )}
    </div>
  );
}
