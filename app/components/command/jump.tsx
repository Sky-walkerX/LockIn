"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, ChevronLeft, ChevronRight, CornerDownLeft, FileText, Inbox } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useSubject, useSubjects } from "@/hooks/useSubjects";
import { useInbox } from "@/hooks/useInbox";
import { useSearch } from "@/hooks/useSearch";
import { excerpt } from "@/lib/notes/excerpt";
import { card, fade } from "@/lib/motion";

const FALLBACK = "#8b8f9e";

// Go to: "/" from anywhere opens a list of sections; a section opens onto its
// notes, and typing finds a note in any of them. In Zen it opens over the
// page being read and keeps you in Zen; elsewhere it opens the note's page.
// The search palette (⌘K) is for everything else. "z" opens Zen from anywhere.

type Opts = { zen?: boolean };
type Jump = {
  open: (opts?: Opts) => void;
  close: () => void;
  isOpen: () => boolean;
  /** Zen on the notes open on this page, or, anywhere else, Go to asking which. */
  readInZen: () => void;
};
const JumpContext = createContext<Jump>({ open: () => {}, close: () => {}, isOpen: () => false, readInZen: () => {} });
export const useJump = () => useContext(JumpContext);

const editable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
const inZen = () => new URLSearchParams(window.location.search).get("zen") === "1";

export function JumpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { status } = useSession();
  const hidden = status !== "authenticated";
  const [state, setState] = useState<{ zen: boolean } | null>(null);
  // Read by Zen when browser full screen ends: the Esc that ended it was
  // meant for this, if this was open.
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = state !== null;
  }, [state]);

  const open = useCallback(
    (opts?: Opts) => {
      if (!hidden) setState({ zen: opts?.zen ?? inZen() });
    },
    [hidden],
  );
  const close = useCallback(() => setState(null), []);
  const isOpen = useCallback(() => openRef.current, []);
  const readInZen = useCallback(() => {
    if (hidden) return;
    const q = new URLSearchParams(window.location.search);
    const onNotes = (pathname === "/inbox" || pathname.startsWith("/subjects/")) && !q.get("tab");
    if (!onNotes) return setState({ zen: true });
    q.set("zen", "1");
    router.push(`${pathname}?${q}`, { scroll: false });
  }, [hidden, pathname, router]);

  useEffect(() => {
    // "/" goes to a section or note, from the page or from Zen. "z" reads in
    // Zen. Neither while typing, or while another dialog has the floor.
    const onKey = (e: KeyboardEvent) => {
      if (hidden || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || editable(e.target)) return;
      if (e.key !== "/" && e.key !== "z") return;
      const modal = document.querySelector('[aria-modal="true"]');
      const zen = !!modal?.classList.contains("lk-zen");
      if (modal && !zen) return;
      if (e.key === "z" && zen) return;
      e.preventDefault();
      if (e.key === "/") setState({ zen: inZen() });
      else readInZen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden, readInZen]);

  const value = useMemo(() => ({ open, close, isOpen, readInZen }), [open, close, isOpen, readInZen]);
  return (
    <JumpContext.Provider value={value}>
      {children}
      <AnimatePresence>{state && !hidden && <JumpPanel key="jump" zen={state.zen} onClose={close} />}</AnimatePresence>
    </JumpContext.Provider>
  );
}

type Row = {
  key: string;
  kind: "section" | "note";
  label: string;
  hint?: string | null;
  tag?: string | null;
  color?: string | null;
  inbox?: boolean;
  run: () => void;
};

function JumpPanel({ zen, onClose }: { zen: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: subjects = [] } = useSubjects();
  const { data: inbox } = useInbox();
  const [input, setInput] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Opens on the section you're in, so its notes are a keystroke away.
  const here = pathname?.match(/^\/subjects\/([^/?#]+)/)?.[1] ?? (pathname === "/inbox" ? (inbox?.id ?? null) : null);
  const [scope, setScope] = useState<string | null>(here);
  const { data: scoped, isLoading: scopeLoading } = useSubject(scope ?? undefined);

  const words = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text: string) => words.every((w) => text.toLowerCase().includes(w));
  // Typing across every section asks the server; inside one, its notes are here.
  const { data: hits = [], isFetching } = useSearch(scope ? "" : input);

  const isInbox = (id: string) => id === inbox?.id;
  const noteHref = (subjectId: string, noteId: string) =>
    `${isInbox(subjectId) ? "/inbox" : `/subjects/${subjectId}`}?note=${noteId}${zen ? "&zen=1" : ""}`;
  const go = (href: string) => () => {
    onClose();
    // Inside Zen a new page replaces the one being read; elsewhere it's a visit.
    if (zen) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  };
  const enter = (id: string) => () => {
    setScope(id);
    setInput("");
  };

  const sections: Row[] = [
    ...(inbox ? [{ key: `s-${inbox.id}`, kind: "section" as const, label: "Inbox", tag: String(inbox.count), inbox: true, run: enter(inbox.id) }] : []),
    ...subjects
      .filter((s) => !s.isArchived && !s.isInbox)
      .map((s) => ({
        key: `s-${s.id}`,
        kind: "section" as const,
        label: s.title,
        tag: String(s._count.milestones),
        color: s.color,
        run: enter(s.id),
      })),
  ];

  let rows: Row[];
  if (scope) {
    // Notes whose titles match come first, then those that only mention it.
    const all = scoped?.milestones ?? [];
    const byTitle = all.filter((n) => matches(n.title));
    const inBody = words.length ? all.filter((n) => !matches(n.title) && matches(n.notes)) : [];
    rows = [...byTitle, ...inBody].map((n) => ({
        key: `n-${n.id}`,
        kind: "note",
        label: n.title,
        hint: excerpt(n.notes),
        color: scoped?.color,
        run: go(noteHref(scope, n.id)),
      }));
  } else if (words.length) {
    const notes: Row[] = hits
      .filter((h) => h.kind === "milestone")
      .flatMap((h) => {
        const subjectId = h.href.match(/^\/subjects\/([^/?#]+)/)?.[1];
        if (!subjectId) return [];
        return [
          {
            key: `n-${h.id}`,
            kind: "note" as const,
            label: h.title,
            hint: h.snippet,
            tag: isInbox(subjectId) ? "Inbox" : h.path[0],
            color: h.color,
            run: go(noteHref(subjectId, h.id)),
          },
        ];
      });
    rows = [...sections.filter((s) => matches(s.label)), ...notes];
  } else {
    rows = sections;
  }

  const scopeTitle = scope ? (isInbox(scope) ? "Inbox" : (scoped?.title ?? subjects.find((s) => s.id === scope)?.title ?? "")) : null;

  // New rows start from the top.
  const [activeFor, setActiveFor] = useState({ input, scope, count: rows.length });
  if (activeFor.input !== input || activeFor.scope !== scope || activeFor.count !== rows.length) {
    setActiveFor({ input, scope, count: rows.length });
    setActive(0);
  }
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const back = () => {
    setScope(null);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const row = rows[active];
    // Stopped here: Zen and the chat panel listen for Escape on the window,
    // and one press should close only this.
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      row?.run();
    } else if (e.key === "ArrowRight" && row?.kind === "section" && e.currentTarget.selectionStart === input.length) {
      e.preventDefault();
      row.run();
    } else if ((e.key === "Backspace" || e.key === "ArrowLeft") && scope && !input) {
      e.preventDefault();
      back();
    }
  };

  const empty = scope
    ? scopeLoading
      ? "Opening…"
      : words.length
        ? `No note in ${scopeTitle} matches “${input.trim()}”.`
        : `${scopeTitle} has no notes yet.`
    : words.length
      ? input.trim().length < 2 || isFetching
        ? "Searching…"
        : `Nothing matches “${input.trim()}”.`
      : "No sections yet.";

  // In Zen the sheet holds the page (and browser full screen), so this opens
  // inside it, on its paper.
  const host = (zen && document.querySelector<HTMLElement>(".lk-zen")) || document.body;

  return createPortal(
    <m.div
      className="lk-jump-backdrop"
      onMouseDown={onClose}
      variants={fade}
      initial="hidden"
      animate="shown"
      exit="exit"
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label="Go to a section or note"
        className="lk-card lk-jump"
        onMouseDown={(e) => e.stopPropagation()}
        variants={card}
      >
        <div className="lk-jump-head">
          {scope ? (
            <button type="button" onClick={back} className="lk-jump-crumb" title="All sections (⌫)">
              <ChevronLeft size={14} /> {scopeTitle}
            </button>
          ) : (
            <span className="lk-jump-slash" aria-hidden>
              /
            </span>
          )}
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={scope ? `Notes in ${scopeTitle}…` : "Go to a section or note…"}
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls="lk-jump-list"
            aria-activedescendant={rows[active] ? `lk-jump-${active}` : undefined}
            className="min-w-0 flex-1 bg-transparent py-1 text-ui outline-none placeholder:text-muted-foreground"
          />
          {zen && (
            <span className="lk-tag flex-none" title="Notes open in Zen">
              <BookOpen size={11} className="mr-1 inline" /> Zen
            </span>
          )}
        </div>

        <div ref={listRef} id="lk-jump-list" role="listbox" className="lk-jump-list">
          {rows.map((row, i) => (
            <button
              key={row.key}
              id={`lk-jump-${i}`}
              data-index={i}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={row.run}
              className="lk-subject lk-jump-row"
              style={{ "--c": row.color ?? FALLBACK } as React.CSSProperties}
            >
              {row.inbox ? (
                <Inbox size={14} className="flex-none text-muted-foreground" />
              ) : row.kind === "section" ? (
                <i className="lk-tab-chip" style={{ background: "var(--c-eff)" }} aria-hidden />
              ) : (
                <FileText size={14} className="flex-none text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{row.label}</span>
                {row.hint && <span className="lk-jump-hint">{row.hint}</span>}
              </span>
              {row.tag && <span className="lk-jump-tag">{row.tag}</span>}
              {row.kind === "section" ? (
                <ChevronRight size={14} className="flex-none text-muted-foreground" aria-hidden />
              ) : (
                i === active && <CornerDownLeft size={13} className="flex-none text-muted-foreground" aria-hidden />
              )}
            </button>
          ))}
          {rows.length === 0 && <p className="lk-jump-empty">{empty}</p>}
        </div>

        <div className="lk-jump-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>↵</kbd> {scope ? "open" : "choose"}
          </span>
          {scope ? (
            <span>
              <kbd>⌫</kbd> sections
            </span>
          ) : (
            <span>
              <kbd>→</kbd> notes
            </span>
          )}
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </m.div>
    </m.div>,
    host,
  );
}
