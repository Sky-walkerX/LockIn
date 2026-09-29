"use client";

import { createContext, useContext, useEffect, useRef } from "react";

/**
 * A search result link's request: the rows to open, outermost first, ending at
 * the result. `done` clears it once the result is on screen.
 */
export type RevealState = { path: string[]; target: string | null; nonce: number; done: () => void };

const RevealContext = createContext<RevealState>({ path: [], target: null, nonce: 0, done: () => {} });
export const RevealProvider = RevealContext.Provider;

/**
 * Lets a plan row answer a search result link. The row opens when the result
 * is the row itself or sits somewhere inside it, and the result's own row
 * scrolls into view with a short highlight. It drives the row's own open state,
 * so afterwards the row collapses and expands like any other.
 *
 * `nonce` changes on every new request, so opening the same result a second
 * time (after collapsing the rows again) works too.
 */
export function useReveal(id: string, setOpen: (open: boolean) => void) {
  const { path, target, nonce, done } = useContext(RevealContext);
  const onPath = path.includes(id);
  const isTarget = target === id;
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (onPath) setOpen(true);
  }, [onPath, nonce, setOpen]);

  useEffect(() => {
    if (!isTarget) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    el?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    // The wash is a one-off CSS animation on the row itself; replaying it is
    // DOM work, not render state, so no re-render rides along with it.
    if (el) {
      el.classList.remove("lk-found");
      void el.offsetWidth; // restart the animation if it was mid-play
      el.classList.add("lk-found");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => el.classList.remove("lk-found"), 2000);
    }
    // The target mounts last, so every row above it is open by now. Clearing
    // the request here stops a row that remounts later (its parent collapsed
    // and reopened by hand) from opening itself again.
    done();
  }, [isTarget, nonce, done]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { ref };
}
