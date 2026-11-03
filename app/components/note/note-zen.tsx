"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ChevronsLeftRight, Search, X } from "lucide-react";
import { AnimatePresence, useScroll } from "motion/react";
import * as m from "motion/react-m";
import type { MilestoneWithTasks } from "@/hooks/useSubjects";
import { useImmersiveSheet } from "@/hooks/useImmersiveSheet";
import { useStoredValue } from "@/hooks/useStoredValue";
import { useJump } from "@/app/components/command/jump";
import { Markdown } from "@/app/components/subject/markdown";
import { isOwnNote, sourceLabel } from "@/lib/notes/source";
import { pageLabel } from "@/lib/notes/page-label";
import { fade } from "@/lib/motion";

// How long the controls stay after the pointer stops.
const IDLE_MS = 2500;
const WIDTH_KEY = "lockin.zen.width";
const OUTLINE_KEY = "lockin.zen.outline";
// How far below the top a heading counts as the one being read.
const READING_LINE = 140;

type Heading = { el: HTMLElement; text: string; level: number };

const editable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

// Zen: a section's notes read one after another on dark paper, whatever the
// notebook's theme, with nothing else on screen. ← and → (or [ and ]) turn
// the page, / goes to any section or note without leaving, W widens the page
// for diagrams and code (and back), O shows the note's headings beside it on
// a wide screen (the one being read marked), the controls fade
// while you read and come back when the pointer moves, and Esc leaves on the
// note last read. Reading only: editing and
// witnessing happen on the note's page.
type Props = {
  /** The section's notes, in reading order (lib/notes/chapters.ts). */
  notes: MilestoneWithTasks[];
  noteId: string;
  sectionTitle: string;
  /** The section's chapters, to say which one a note is in. */
  chapters?: { id: string; title: string }[];
  /** The subject's colour. The sheet is portalled out of the page that sets it. */
  color: string | null;
  onNavigate: (noteId: string) => void;
  onClose: () => void;
};

const noop = () => () => {};

export function NoteZen(props: Props) {
  // A link or a reload can land straight in Zen, and the page is rendered on
  // the server first. The sheet belongs to the browser (it's portalled into
  // <body> and takes the window), so it appears once the page has hydrated.
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  return inBrowser ? <ZenSheet {...props} /> : null;
}

function ZenSheet({ notes, noteId, sectionTitle, chapters, color, onNavigate, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const jump = useJump();
  // In browser full screen the browser takes Esc to leave it, so the Esc that
  // was meant to close Go to arrives here instead: close that, stay in Zen.
  useImmersiveSheet(sheetRef, {
    onClose,
    onBrowserExit: () => {
      if (jump.isOpen()) jump.close();
      else onClose();
    },
  });

  const at = Math.max(0, notes.findIndex((n) => n.id === noteId));
  const note = notes[at];
  const chapterTitle = note?.chapterId ? chapters?.find((c) => c.id === note.chapterId)?.title : undefined;
  const prev = notes[at - 1] ?? null;
  const next = notes[at + 1] ?? null;

  const [width, setWidth] = useStoredValue(WIDTH_KEY, "comfortable");
  const wide = width === "wide";
  const toggleWidth = () => setWidth(wide ? "comfortable" : "wide");

  const go = (step: -1 | 1) => {
    const to = notes[at + step];
    if (to) onNavigate(to.id);
  };
  const [outlineSetting, setOutline] = useStoredValue(OUTLINE_KEY, "on");
  const outlineOn = outlineSetting === "on";
  const toggleOutline = () => setOutline(outlineOn ? "off" : "on");

  const turn = useEffectEvent(go);
  const widen = useEffectEvent(toggleWidth);
  const outline = useEffectEvent(toggleOutline);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || editable(e.target)) return;
      if (e.key === "ArrowLeft" || e.key === "[") turn(-1);
      else if (e.key === "ArrowRight" || e.key === "]") turn(1);
      else if (e.key === "w" || e.key === "W") widen();
      else if (e.key === "o" || e.key === "O") outline();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A new page starts at its top.
  const noteKey = note?.id;
  useEffect(() => {
    sheetRef.current?.scrollTo({ top: 0 });
  }, [noteKey]);

  // The controls fade once the pointer rests. A tap on a phone counts as the
  // pointer moving, and Tab brings them back for the keyboard.
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer = 0;
    const wake = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") wake();
    };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const { scrollYProgress } = useScroll({ container: sheetRef });

  // The note's headings, read off the page once it has rendered (its body is
  // markdown, so they're whatever the note says), and the one being read:
  // the last to have passed the reading line.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [current, setCurrent] = useState(-1);
  useEffect(() => {
    // After the page's fade in, so the body is the new note's.
    const t = window.setTimeout(() => {
      const els = [...(bodyRef.current?.querySelectorAll<HTMLElement>("h1, h2, h3") ?? [])];
      setHeadings(els.map((el) => ({ el, text: el.textContent?.trim() ?? "", level: Number(el.tagName[1]) })).filter((h) => h.text));
      setCurrent(-1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [noteKey]);
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || headings.length === 0) return;
    const onScroll = () => {
      let at = -1;
      headings.forEach((h, i) => {
        if (h.el.getBoundingClientRect().top < READING_LINE) at = i;
      });
      setCurrent(at);
    };
    onScroll();
    sheet.addEventListener("scroll", onScroll, { passive: true });
    return () => sheet.removeEventListener("scroll", onScroll);
  }, [headings]);
  const top = Math.min(...headings.map((h) => h.level));

  if (!note) return null;

  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      ref={sheetRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="zen-note-title"
      className="dark lk-subject lk-zen"
      data-idle={idle ? "" : undefined}
      data-width={wide ? "wide" : undefined}
      style={{ "--c": color ?? "#8b918d" } as React.CSSProperties}
    >
      <div className="lk-zen-bar">
        <span className="lk-zen-where">
          <b>{sectionTitle}</b> · {at + 1} of {notes.length}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => jump.open({ zen: true })} className="lk-zen-btn" title="Go to a section or note (/)">
            <Search size={15} /> Go to <kbd>/</kbd>
          </button>
          <button
            type="button"
            onClick={toggleWidth}
            aria-pressed={wide}
            className="lk-zen-btn"
            title={wide ? "Narrower page (W)" : "Wider page, for diagrams and code (W)"}
            aria-label="Wide page"
          >
            <ChevronsLeftRight size={16} />
          </button>
          <button type="button" onClick={() => go(-1)} disabled={!prev} className="lk-zen-btn" title="Previous note (←)" aria-label="Previous note">
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => go(1)} disabled={!next} className="lk-zen-btn" title="Next note (→)" aria-label="Next note">
            <ArrowRight size={16} />
          </button>
          <button type="button" onClick={onClose} className="lk-zen-btn" title="Leave Zen (Esc)">
            <X size={16} /> Leave <kbd>Esc</kbd>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <m.article key={note.id} className="lk-zen-page" variants={fade} initial="hidden" animate="shown" exit="exit">
          <p className="lk-zen-runhead">
            {sectionTitle}
            {chapterTitle && <> · {chapterTitle}</>}
            {note.page != null && <> · {pageLabel(note.page)}</>}
          </p>
          <h1 id="zen-note-title" className="lk-zen-title">
            {note.title}
          </h1>
          <div className="lk-zen-rule" />
          {!isOwnNote(note.source) && <p className="lk-zen-provenance">Recorded by {sourceLabel(note.source)}</p>}
          {note.notes.trim() ? (
            <div ref={bodyRef} className="lk-zen-body">
              <Markdown page={note.page}>{note.notes}</Markdown>
            </div>
          ) : (
            <p className="lk-zen-empty">Nothing written yet.</p>
          )}

          <footer className="lk-zen-end">
            {next ? (
              <button type="button" onClick={() => go(1)} className="lk-zen-next">
                <span className="lk-zen-next-label">Next</span>
                <span className="lk-zen-next-title">{next.title}</span>
                <ArrowRight size={18} aria-hidden />
              </button>
            ) : (
              <p className="lk-zen-fin">
                The end of {sectionTitle}.{" "}
                <button type="button" onClick={onClose}>
                  Leave Zen
                </button>
              </p>
            )}
          </footer>
        </m.article>
      </AnimatePresence>

      {/* Two headings make a note worth a map; one doesn't. */}
      {outlineOn && headings.length > 1 && (
        <nav className="lk-zen-outline" aria-label="In this note">
          <p className="lk-zen-outline-label">In this note</p>
          <ol>
            {headings.map((h, i) => (
              <li key={i} style={{ paddingLeft: `${(h.level - top) * 12}px` }}>
                <button
                  type="button"
                  aria-current={i === current ? "location" : undefined}
                  onClick={() => h.el.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <m.div className="lk-zen-progress" style={{ scaleX: scrollYProgress }} aria-hidden />
    </m.div>,
    document.body,
  );
}
