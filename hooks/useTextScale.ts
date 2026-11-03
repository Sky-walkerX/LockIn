"use client";

import { useStoredValue } from "@/hooks/useStoredValue";

// How large a note's text reads in Zen and the Zen workspace, as a multiple
// of their own sizes. Remembered per browser; the shell puts it on <html> as
// --lk-text-scale, which only those two read.
const KEY = "lockin.text.scale";
export const TEXT_SCALES = [0.85, 0.92, 1, 1.1, 1.2, 1.32, 1.45] as const;

export function useTextScale() {
  const [stored, setStored] = useStoredValue(KEY, "1");
  const at = Math.max(0, TEXT_SCALES.findIndex((s) => String(s) === stored));
  const scale = TEXT_SCALES[at] ?? 1;
  const to = (i: number) => setStored(String(TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, Math.max(0, i))]));
  return {
    scale,
    larger: () => to(at + 1),
    smaller: () => to(at - 1),
    reset: () => setStored("1"),
    largest: at === TEXT_SCALES.length - 1,
    smallest: at === 0,
  };
}
