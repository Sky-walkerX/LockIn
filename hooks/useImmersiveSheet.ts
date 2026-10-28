"use client";

import { useEffect, useEffectEvent, useState, type RefObject } from "react";

// When a sheet in browser full screen last closed. One that opens in its
// place (Zen moving to another section) waits for the browser to finish
// leaving the old full screen before asking for its own, or that exit, which
// lands a moment later, would end the new one too.
let fullClosedAt = -Infinity;

function fullScreenSettled(): Promise<void> {
  if (performance.now() - fullClosedAt > 1000) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.clearTimeout(timer);
      resolve();
    };
    const onChange = () => {
      if (!document.fullscreenElement) done();
    };
    document.addEventListener("fullscreenchange", onChange);
    // Already over, then: the event came before this sheet did.
    const timer = window.setTimeout(done, 400);
  });
}

/**
 * A sheet that takes the whole window: Full screen and Zen. It takes focus,
 * stops the page behind it scrolling, and asks the browser for real full
 * screen, falling back to just covering the window where that's refused
 * (Safari in some contexts, embedded frames). Esc closes it. On the way out
 * the page is put back where it was and focus returns to whatever opened it.
 */
export function useImmersiveSheet(
  sheetRef: RefObject<HTMLElement | null>,
  {
    onClose,
    onBrowserExit = onClose,
  }: {
    onClose: () => void;
    /** Leaving browser full screen. Full screen keeps an edit open through it. */
    onBrowserExit?: () => void;
  },
) {
  // Whatever opened the sheet gets focus back. Read on the first render,
  // before the sheet takes focus.
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null));
  const close = useEffectEvent(onClose);
  const browserExit = useEffectEvent(onBrowserExit);

  useEffect(() => {
    const sheet = sheetRef.current;
    sheet?.focus();
    const scrollY = window.scrollY;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const enter = () => fullScreenSettled().then(() => (sheet?.isConnected ? sheet.requestFullscreen?.() : undefined));
    enter().catch(() => {});
    // Taking over from a sheet that just closed, the old exit can still land
    // after this one is in; for a moment, losing full screen means asking
    // again, once, rather than that the reader left.
    const handoffUntil = performance.now() - fullClosedAt < 1000 ? performance.now() + 2000 : 0;
    let retried = false;

    // In browser full screen the browser takes Esc itself to leave it, and the
    // keydown never arrives: follow it out instead. Only out of this sheet's
    // own full screen, while it's still on the page: a sheet being taken away
    // ends its full screen before this listener is removed.
    // Entering it moves focus to <body>, so take it back.
    let full = false;
    const onFullscreenChange = () => {
      if (document.fullscreenElement === sheet) {
        full = true;
        sheet?.focus();
      } else if (full) {
        full = false;
        if (!sheet?.isConnected) return;
        if (!retried && performance.now() < handoffUntil) {
          retried = true;
          sheet.requestFullscreen?.().catch(() => {});
        } else browserExit();
      }
    };
    // Outside browser full screen Esc comes to us. An editor that used the key
    // (cancelling an edit) has already claimed it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) close();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.scrollTo({ top: scrollY });
      // Leaving browser full screen resets focus to <body> once it settles, so
      // hand focus back after that, not before, and only once the sheet is
      // really gone (React's dev mode runs this cleanup and remounts it).
      const refocus = () =>
        requestAnimationFrame(() => {
          if (!sheet?.isConnected) opener?.focus({ preventScroll: true });
        });
      if (full) fullClosedAt = performance.now();
      if (document.fullscreenElement) document.exitFullscreen().then(refocus, refocus);
      else refocus();
    };
  }, [sheetRef, opener]);
}
