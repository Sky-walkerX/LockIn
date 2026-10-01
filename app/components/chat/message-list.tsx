"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ChatMessage } from "@/app/generated/prisma/browser";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Markdown } from "@/app/components/subject/markdown";
import { splitReasoning } from "@/lib/chat/reasoning";
import { citedPages, linkCitations } from "@/lib/chat/citations";
import { refHref, type MessageRef } from "@/lib/chat/refs";
import { pageLabel } from "@/lib/notes/page-label";
import type { StreamPhase } from "@/hooks/useChat";
import { SaveToNote } from "./save-to-note";

/** Short local timestamp: "2:34 PM" */
function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The transcript, plus the reply currently arriving.
 *
 * Autoscroll follows the stream only while the user is already at the bottom —
 * yanking the view down while they're reading an earlier answer is worse than
 * not following at all.
 */
export function MessageList({
  messages,
  streamText,
  isStreaming,
  phase,
  phaseDetail,
  error,
  subjectId,
  streamRefs,
}: {
  messages: ChatMessage[];
  /** The pages the reply arriving now can cite. */
  streamRefs?: MessageRef[];
  streamText: string;
  isStreaming: boolean;
  phase: StreamPhase;
  phaseDetail: string | null;
  error: string | null;
  subjectId: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, streamText]);

  const empty = messages.length === 0 && !isStreaming && !error;

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      {empty && (
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Ask about your notes, or anything else.
          <br />
          Pick subjects below, and answers cite the pages they used.
        </p>
      )}

      {messages.map((message) =>
        message.role === "USER" ? (
          <div key={message.id} className="lk-chat-bubble user">
            <p className="whitespace-pre-wrap">{message.content}</p>
            <span className="lk-print mt-1.5 block text-right text-2xs uppercase tracking-wide text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
          </div>
        ) : (
          <AssistantBubble
            key={message.id}
            content={message.content}
            model={message.model}
            sources={message.sources}
            refs={readRefs(message.refs)}
            subjectId={subjectId}
          />
        ),
      )}

      {isStreaming && <StreamingBubble text={streamText} refs={streamRefs} phase={phase} detail={phaseDetail} />}

      {error && (
        <div className="lk-card border-destructive p-3">
          <p className="text-xs leading-relaxed text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * A stored reply. Reasoning models emit a `<think>` scratchpad that would bury
 * the answer, so it's split out and collapsed — available, but not in the way.
 */
function AssistantBubble({
  content,
  model,
  sources,
  refs,
  subjectId,
}: {
  content: string;
  model: string | null;
  sources: string[];
  refs: MessageRef[] | null;
  subjectId: string | null;
}) {
  const { answer, reasoning } = splitReasoning(content);

  return (
    <div className="lk-chat-bubble assistant">
      {reasoning && <Reasoning text={reasoning} />}
      <Answer text={answer} refs={refs} />
      {/* Replies from before pages existed only have breadcrumbs. */}
      {refs ? <FromNotebook refs={refs} answer={answer} /> : sources.length > 0 && <Sources breadcrumbs={sources} />}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="lk-print truncate text-2xs uppercase tracking-wide text-muted-foreground">
          {model ?? ""}
        </span>
        {subjectId && <SaveToNote subjectId={subjectId} answer={answer} />}
      </div>
    </div>
  );
}

/** `ChatMessage.refs` is JSON; anything that isn't a list of refs reads as none. */
function readRefs(value: unknown): MessageRef[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (r): r is MessageRef => !!r && typeof r === "object" && typeof r.page === "number" && typeof r.id === "string",
  );
}

/** An answer, with its "[p. 12]" citations drawn as links to the page. */
function Answer({ text, refs }: { text: string; refs: MessageRef[] | null | undefined }) {
  if (!refs || refs.length === 0) return <Markdown>{text}</Markdown>;
  const byPage = new Map(refs.map((r) => [r.page, r]));
  return (
    <Markdown cite={(page) => (byPage.has(page) ? <Cite target={byPage.get(page)!} /> : pageLabel(page))}>
      {linkCitations(text, new Set(byPage.keys()))}
    </Markdown>
  );
}

function Cite({ target }: { target: MessageRef }) {
  return (
    <Link
      href={refHref(target)}
      className="lk-cite"
      title={`${target.subjectTitle} › ${target.title}`}
      aria-label={`Page ${target.page}: ${target.title}`}
    >
      {pageLabel(target.page)}
    </Link>
  );
}

/**
 * The pages an answer drew on: the passages search retrieved for it, and any
 * page it cites. Always shown, because a small model often answers from a
 * passage without citing it, and this is how the user checks the answer
 * against the notes it came from.
 */
function FromNotebook({ refs, answer }: { refs: MessageRef[]; answer: string }) {
  const cited = new Set(citedPages(answer));
  const shown = refs.filter((r) => r.retrieved || cited.has(r.page)).sort((a, b) => a.page - b.page);
  if (shown.length === 0) return null;

  return (
    <div className="mt-2.5 border-t border-border pt-2">
      <p className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">From your notebook</p>
      <ul className="mt-1 space-y-0.5">
        {shown.map((r) => (
          <li key={r.page}>
            <Link
              href={refHref(r)}
              className="group flex items-baseline gap-2 text-2xs leading-relaxed text-muted-foreground hover:text-foreground"
            >
              <span className="lk-cite">{pageLabel(r.page)}</span>
              <span className="truncate">
                {r.subjectTitle} › <span className="group-hover:underline">{r.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The retrieved passages an answer drew on — collapsed by default. This is
 * the feature's honesty mechanism: it's how a user notices the model
 * answered from the wrong passage.
 *
 * Plain text rather than links: `ChatMessage.sources` stores breadcrumbs
 * only, not per-passage subject ids, and a retrieved passage can belong
 * to any subject in scope — not just the one the chat was opened from.
 */
function Sources({ breadcrumbs }: { breadcrumbs: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="lk-print flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />} sources · {breadcrumbs.length}
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 border-l-2 border-border pl-2.5">
          {breadcrumbs.map((breadcrumb, i) => (
            <li key={i} className="text-2xs leading-relaxed text-muted-foreground">
              {breadcrumb}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What each waiting step is called, in the user's terms rather than ours. */
const PHASE_LABEL: Record<StreamPhase, string> = {
  idle: "waiting",
  embedding: "searching your notes",
  preparing: "gathering context",
  waiting: "thinking",
  streaming: "thinking",
};

/**
 * Seconds since the reply started, once it's been long enough to be worth
 * saying. A local model can take twenty seconds before its first token, and
 * an indicator that never changes is indistinguishable from a hang.
 */
function useElapsed(active: boolean): number {
  const [seconds, setSeconds] = useState(0);
  // Each new reply counts from zero: reset as it starts, while rendering.
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setSeconds(0);
  }

  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

/**
 * The reply as it arrives.
 *
 * Until the first whole word exists it shows what it's actually waiting on.
 * Once text is arriving it renders that text and nothing else: the caret used
 * to sit alone in an empty bubble, which read as a stray lime rectangle rather
 * than as progress.
 */
function StreamingBubble({
  text,
  refs,
  phase,
  detail,
}: {
  text: string;
  refs: MessageRef[] | undefined;
  phase: StreamPhase;
  detail: string | null;
}) {
  const { answer, reasoning } = splitReasoning(text);
  const elapsed = useElapsed(true);

  // `streamingPrefix` withholds text until a word completes, so an empty
  // `answer` here means nothing is ready to paint, not that nothing arrived.
  const waiting = !answer;

  return (
    <div className="lk-chat-bubble assistant">
      {reasoning && <Reasoning text={reasoning} defaultOpen={false} />}

      {waiting ? (
        <Thinking label={PHASE_LABEL[phase]} detail={detail} elapsed={elapsed} />
      ) : (
        // The caret is a pseudo-element on the last rendered block, not a
        // sibling: as a sibling of a block-level <p> it wrapped onto its own
        // line instead of trailing the sentence.
        <div className="lk-chat-stream">
          <Answer text={answer} refs={refs} />
        </div>
      )}

      <span className="sr-only">Generating a reply</span>
    </div>
  );
}

/** Three staggered dots and a label. The dots carry the sense of ongoing work
 *  that a single blinking block never did. */
function Thinking({ label, detail, elapsed }: { label: string; detail: string | null; elapsed: number }) {
  return (
    <span className="lk-thinking" role="status" aria-live="polite">
      <span className="lk-thinking-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">
        {label}
        {detail && ` · ${detail}`}
        {!detail && elapsed >= 3 && ` · ${elapsed}s`}
      </span>
    </span>
  );
}

function Reasoning({ text, defaultOpen = false }: { text: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="lk-print flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />} reasoning
      </button>
      {open && (
        <div className="mt-1.5 whitespace-pre-wrap border-l-2 border-border pl-2.5 text-2xs leading-relaxed text-muted-foreground">
          {text}
        </div>
      )}
    </div>
  );
}
