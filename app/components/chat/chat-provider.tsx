"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useLatest } from "@/hooks/useLatest";
import { useChromeless } from "@/hooks/useChromeless";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { SETTLE, fade } from "@/lib/motion";

// Mirrors the quick-add provider: the panel is global, so the hotkey lives with
// the provider rather than in any one page.

// The panel brings the markdown renderer, KaTeX and highlight.js with it, so
// its code loads the first time Ask opens rather than with every page.
const ChatPanel = dynamic(() => import("./chat-panel").then((m) => m.ChatPanel), { ssr: false });

/** Where conversations get the whole page. */
export const ASK_PATH = "/ask";

// `prompt` opens the panel with a draft already typed (the palette's "Ask").
type OpenChat = (opts?: { prompt?: string }) => void;
type Seed = { text: string; n: number } | null;
type ChatState = {
  open: OpenChat;
  /** A reply is arriving in the floating panel. */
  isStreaming: boolean;
  /** A reply arrived while the floating panel was closed. */
  unseen: boolean;
  /** The latest draft handed to Ask, for whichever panel is showing. */
  seed: Seed;
};
const ChatContext = createContext<ChatState>({ open: () => {}, isStreaming: false, unseen: false, seed: null });
export const useChatPanel = () => useContext(ChatContext);

// Ask floats: ⌘J, "Ask this note" and the palette open a panel over the page,
// in its corner, and closing it gives the page all its width back. It's for a
// quick question beside what you're reading; a longer conversation moves to
// /ask, which has the room and the history beside it. On /ask itself the
// page's own panel answers, so the floating one stays away.
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const hidden = useChromeless();
  const pathname = usePathname();
  const router = useRouter();
  const onAskPage = pathname === ASK_PATH;

  const [isOpen, setOpenState] = useState(false);
  const floatRef = useRef<HTMLDivElement>(null);
  // Closing takes the focus out of the panel first. Left in its text box, the
  // focus held the faded panel in place over the page's corner, invisible
  // but still taking clicks.
  const setIsOpen = useCallback((next: boolean) => {
    const focused = document.activeElement;
    if (!next && focused instanceof HTMLElement && floatRef.current?.contains(focused)) focused.blur();
    setOpenState(next);
  }, []);
  // Closing hides the panel rather than unmounting it, so a thread, and any
  // reply still arriving, survives until it's opened again. Nothing mounts
  // for someone who never asks, which keeps indexing off the pages that
  // don't need it.
  const [opened, setOpened] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const shown = isOpen && !onAskPage;

  // `onStreamingChange` fires from inside the panel's render tree, so the open
  // state it reads has to come from a ref rather than the closure it captured.
  const shownRef = useLatest(shown);

  const [seed, setSeed] = useState<Seed>(null);

  const open = useCallback<OpenChat>(
    (opts) => {
      if (hidden) return;
      const prompt = opts?.prompt;
      if (prompt) setSeed((s) => ({ text: prompt, n: (s?.n ?? 0) + 1 }));
      setUnseen(false);
      // /ask's panel takes the seed itself.
      if (onAskPage) return;
      setOpened(true);
      setIsOpen(true);
    },
    [hidden, onAskPage, setIsOpen],
  );

  const toggle = useCallback(() => {
    if (hidden || onAskPage) return;
    setOpened(true);
    if (!shownRef.current) setUnseen(false);
    setIsOpen(!shownRef.current);
  }, [hidden, onAskPage, shownRef, setIsOpen]);

  const onStreamingChange = useCallback(
    (streaming: boolean) => {
      setIsStreaming(streaming);
      // A reply that lands while the panel is closed is the one worth marking.
      if (!streaming && !shownRef.current) setUnseen(true);
    },
    [shownRef],
  );

  // Continuing on /ask: the page opens the same conversation, and the
  // floating panel steps aside.
  const expand = useCallback(
    (conversationId: string | null) => {
      setIsOpen(false);
      router.push(conversationId ? `${ASK_PATH}?c=${conversationId}` : ASK_PATH);
    },
    [router, setIsOpen],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "Escape" && shownRef.current) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, shownRef, setIsOpen]);

  return (
    <ChatContext.Provider value={{ open, isStreaming, unseen, seed }}>
      {children}

      {!hidden && opened && (
        <m.div
          ref={floatRef}
          className="lk-chat-float-wrap"
          // Closed, it's out of reach of the pointer and the keyboard while it fades.
          inert={!shown}
          initial={false}
          animate={shown ? "shown" : "hidden"}
          variants={{
            shown: { opacity: 1, y: 0, display: "block", transition: { duration: 0.28, ease: SETTLE } },
            hidden: { opacity: 0, y: 16, transition: { duration: 0.16, ease: SETTLE }, transitionEnd: { display: "none" } },
          }}
        >
          <ChatPanel
            variant="float"
            isOpen={shown}
            onClose={() => setIsOpen(false)}
            onExpand={expand}
            onStreamingChange={onStreamingChange}
            seed={onAskPage ? null : seed}
          />
        </m.div>
      )}

      {/* On a phone the panel takes the screen, so it needs a scrim behind it. */}
      <AnimatePresence>
        {!hidden && shown && (
          <m.div
            key="scrim"
            className="fixed inset-0 z-[59] bg-black/30 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden
            variants={fade}
            initial="hidden"
            animate="shown"
            exit="exit"
          />
        )}
      </AnimatePresence>
    </ChatContext.Provider>
  );
}
