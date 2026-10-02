"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import s from "./landing.module.css";

// The landing page's "Read without distraction" demo: the same behaviour as a
// real note's full screen (NoteFullscreen), on an example note passed in as
// children. Esc, or leaving browser full screen, brings the visitor back.
export function FullscreenDemo({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" className={`${s.btn} ${s.btnLine}`} onClick={() => setOpen(true)}>
        <Maximize2 className={s.icon} aria-hidden />
        Try it on this note
      </button>
      {open && (
        <Sheet title={title} returnFocusTo={triggerRef} onClose={() => setOpen(false)}>
          {children}
        </Sheet>
      )}
    </>
  );
}

function Sheet({
  title,
  children,
  returnFocusTo,
  onClose,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  returnFocusTo: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const sheet = sheetRef.current;
    const trigger = returnFocusTo.current;
    sheet?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheet?.requestFullscreen?.().catch(() => {});

    // In browser full screen the browser takes Esc to leave it and the keydown
    // never arrives, so follow it out; otherwise Esc comes to us.
    // Entering it moves focus to <body>, so take it back.
    const onFullscreenChange = () => {
      if (document.fullscreenElement) sheet?.focus();
      else close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      // Leaving browser full screen resets focus to <body> once it settles, so
      // hand focus back to the button after that, not before, and only once
      // the sheet is really gone (React's dev mode runs this cleanup and
      // remounts it).
      const refocus = () =>
        requestAnimationFrame(() => {
          if (!sheet?.isConnected) trigger?.focus({ preventScroll: true });
        });
      if (document.fullscreenElement) document.exitFullscreen().then(refocus, refocus);
      else refocus();
    };
  }, [returnFocusTo]);

  return (
    <div ref={sheetRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Example note, full screen" className={s.fs}>
      <div className={s.fsBar}>
        <span className={s.runhead}>{title}</span>
        <button type="button" className={s.sbtn} onClick={onClose}>
          <Minimize2 className={s.icon} aria-hidden />
          Exit <span className={s.esc}>Esc</span>
        </button>
      </div>
      {children}
    </div>
  );
}
