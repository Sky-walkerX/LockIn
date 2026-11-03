"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { X } from "lucide-react";
import { card, fade } from "@/lib/motion";
import { useMounted } from "@/hooks/useMounted";

// "?" lists the notebook's keys, from any page and from Zen. Anything can open
// it by dispatching OPEN_SHORTCUTS on the window (the palette does).
export const OPEN_SHORTCUTS = "lockin:shortcuts";

const GROUPS: { title: string; keys: [keys: string[], what: string][] }[] = [
  {
    title: "Anywhere",
    keys: [
      [["⌘", "K"], "Search everything"],
      [["/"], "Go to a section or note"],
      [["Z"], "Read in Zen"],
      [["⇧", "Z"], "Zen workspace, on and off"],
      [["⌘", "J"], "Ask, in a panel over the page"],
      [["?"], "These keys"],
    ],
  },
  {
    title: "Reading in Zen",
    keys: [
      [["←", "→"], "Previous and next note (or [ and ])"],
      [["W"], "Wide page, for diagrams and code"],
      [["O"], "The note's headings beside it"],
      [["−", "="], "Smaller and larger text (0 for normal)"],
      [["Esc"], "Leave, on the note last read"],
    ],
  },
  {
    title: "Zen workspace",
    keys: [
      [["−", "="], "Smaller and larger text (0 for normal)"],
      [["⇧", "Z"], "Leave the workspace"],
    ],
  },
  {
    title: "Writing a note",
    keys: [
      [["⌘", "↩"], "Save"],
      [["Esc"], "Stop editing"],
      [["⇥"], "Take the suggested words"],
      [["⌃", "Space"], "Ask the model to go on"],
    ],
  },
  {
    title: "Note list",
    keys: [
      [["Drag"], "Put a note in a new place"],
      [["Space", "↑", "↓"], "The same from a note's grip"],
    ],
  },
];

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || typing(e.target)) return;
      // Over Zen, but not over another dialog.
      const modal = document.querySelector('[aria-modal="true"]');
      if (modal && !modal.classList.contains("lk-zen")) return;
      e.preventDefault();
      setOpen(true);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    // Captured, so Zen's own Esc (leaving it) doesn't fire as well.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!mounted) return null;
  // In Zen the sheet holds the page (and browser full screen), so this opens on it.
  const host = document.querySelector<HTMLElement>(".lk-zen") ?? document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div className="lk-jump-backdrop" onMouseDown={() => setOpen(false)} variants={fade} initial="hidden" animate="shown" exit="exit">
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lk-keys-title"
            className="lk-card lk-keys"
            onMouseDown={(e) => e.stopPropagation()}
            variants={card}
          >
            <div className="lk-keys-head">
              <h2 id="lk-keys-title">Keys</h2>
              <button type="button" onClick={() => setOpen(false)} className="lk-iconbtn" aria-label="Close" autoFocus>
                <X size={15} />
              </button>
            </div>
            <div className="lk-keys-groups">
              {GROUPS.map((g) => (
                <section key={g.title}>
                  <h3>{g.title}</h3>
                  <dl>
                    {g.keys.map(([keys, what]) => (
                      <div key={what}>
                        <dt>
                          {keys.map((k) => (
                            <kbd key={k}>{k}</kbd>
                          ))}
                        </dt>
                        <dd>{what}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    host,
  );
}
