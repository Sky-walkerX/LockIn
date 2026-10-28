"use client";

import { useEffect, useEffectEvent, useState, type RefObject } from "react";

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

    sheet?.requestFullscreen?.().catch(() => {});

    // In browser full screen the browser takes Esc itself to leave it, and the
    // keydown never arrives: follow it out instead.
    // Entering it moves focus to <body>, so take it back.
    const onFullscreenChange = () => {
      if (document.fullscreenElement) sheet?.focus();
      else browserExit();
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
      if (document.fullscreenElement) document.exitFullscreen().then(refocus, refocus);
      else refocus();
    };
  }, [sheetRef, opener]);
}
