"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLatest } from "@/hooks/useLatest";
import { useStoredValue } from "@/hooks/useStoredValue";
import { useChromeless } from "@/hooks/useChromeless";
import { ChatPanel } from "./chat-panel";
import { ChatRail } from "./chat-rail";

// Mirrors the quick-add provider: the panel is global, so the hotkey lives with
// the provider rather than in any one page. Which routes render no chrome at all
// is shared with the sidebar and quick-add — see `lib/chrome.ts`.
const OPEN_KEY = "lockin.chat.open";

// `prompt` opens the panel with a draft already typed (the palette's "Ask").
type OpenChat = (opts?: { prompt?: string }) => void;
const ChatContext = createContext<{ open: OpenChat }>({ open: () => {} });
export const useChatPanel = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const hidden = useChromeless();

  // Open/closed is remembered across reloads. It's a layout participant, so the
  // stored value is read through useStoredValue: the server render and
  // hydration see "closed", and the client switches without a flash of state.
  const [stored, setStored] = useStoredValue(OPEN_KEY, "0");
  const isOpen = stored === "1";
  const setIsOpen = useCallback((open: boolean) => setStored(open ? "1" : "0"), [setStored]);

  // Collapsing hides the panel rather than unmounting it, so a thread — and any
  // reply still arriving — survives the rail. Nothing mounts for someone who
  // never asks, which is what keeps indexing off the pages that don't need it.
  const [opened, setOpened] = useState(false);
  const mounted = opened || isOpen;
  const [isStreaming, setIsStreaming] = useState(false);
  const [unseen, setUnseen] = useState(false);

  // `onStreamingChange` fires from inside the panel's render tree, so the open
  // state it reads has to come from a ref rather than the closure it captured.
  const openRef = useLatest(isOpen);

  const [seed, setSeed] = useState<{ text: string; n: number } | null>(null);

  const open = useCallback<OpenChat>((opts) => {
    if (hidden) return;
    const prompt = opts?.prompt;
    if (prompt) setSeed((s) => ({ text: prompt, n: (s?.n ?? 0) + 1 }));
    setOpened(true);
    setIsOpen(true);
    setUnseen(false);
  }, [hidden, setIsOpen]);

  const toggle = useCallback(() => {
    if (hidden) return;
    setOpened(true);
    if (!openRef.current) setUnseen(false);
    setIsOpen(!openRef.current);
  }, [hidden, setIsOpen, openRef]);

  const onStreamingChange = useCallback((streaming: boolean) => {
    setIsStreaming(streaming);
    // A reply that lands behind the rail is the one worth marking.
    if (!streaming && !openRef.current) setUnseen(true);
  }, [openRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, setIsOpen]);

  return (
    <ChatContext.Provider value={{ open }}>
      <div className="flex min-h-screen w-full">
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>

        {!hidden && (
          <div className="sticky top-0 z-40 flex h-screen flex-none">
            {mounted && (
              <div className={isOpen ? "contents" : "hidden"}>
                <ChatPanel
                  isOpen={isOpen}
                  onClose={() => setIsOpen(false)}
                  onStreamingChange={onStreamingChange}
                  seed={seed}
                />
              </div>
            )}
            <ChatRail
              isOpen={isOpen}
              isStreaming={isStreaming}
              unseen={unseen}
              onToggle={toggle}
            />
          </div>
        )}

        {/* Below `sm` the panel is an overlay again, so it needs its scrim back.
            Under the panel's z-40 container, or it covers the panel too. */}
        {mounted && isOpen && !hidden && (
          <div
            className="fixed inset-0 z-30 bg-black/30 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
        )}
      </div>
    </ChatContext.Provider>
  );
}
