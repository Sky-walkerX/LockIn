"use client";

import { useEffect, type RefObject } from "react";
import { findQuote } from "@/lib/notes/plain-text";

const NAME = "lk-passage";

/**
 * How the passage is marked. Rendered as a <style> beside the text rather than
 * kept in globals.css: Turbopack's CSS parser doesn't know ::highlight() yet
 * and would drop the rule from the production build.
 */
export const PASSAGE_HIGHLIGHT_CSS = `::highlight(${NAME}) { background-color: color-mix(in oklch, var(--lk-live) 28%, transparent); }`;

/**
 * Marks a quoted passage in rendered text and scrolls to it: where a cited
 * page ("p. 12" in an Ask answer) opens. Uses the CSS Custom Highlight API, so
 * the DOM React rendered is never touched; browsers without it just open the
 * page at the top.
 */
export function usePassageHighlight(ref: RefObject<HTMLElement | null>, quote: string | null, content: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !quote || typeof CSS === "undefined" || !("highlights" in CSS)) return;

    // The text as one string, a space between text nodes so words in
    // neighbouring blocks don't run together, with where each node starts.
    const nodes: Text[] = [];
    const starts: number[] = [];
    let text = "";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      nodes.push(n as Text);
      starts.push(text.length);
      text += `${n.nodeValue ?? ""} `;
    }
    const found = findQuote(text, quote);
    if (!found) return;

    const locate = (index: number, end: boolean): [Text, number] => {
      let k = starts.length - 1;
      while (k > 0 && starts[k] > index - (end ? 1 : 0)) k--;
      const length = nodes[k].nodeValue?.length ?? 0;
      return [nodes[k], Math.min(Math.max(index - starts[k], 0), length)];
    };
    const range = document.createRange();
    range.setStart(...locate(found[0], false));
    range.setEnd(...locate(found[1], true));

    CSS.highlights.set(NAME, new Highlight(range));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    range.startContainer.parentElement?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    return () => {
      CSS.highlights.delete(NAME);
    };
  }, [ref, quote, content]);
}
