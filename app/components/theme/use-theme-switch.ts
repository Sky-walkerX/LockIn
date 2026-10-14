"use client";

import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

type Theme = "light" | "dark" | "system";

/**
 * Light and dark paper, switched so the new paper spreads from where it was
 * asked for, a circle growing out of the button, instead of the whole page
 * snapping. `origin` is the click; without one it grows from the middle.
 *
 * It's a view transition: the browser takes a picture of the page, the theme
 * changes underneath, and the new page is revealed through the circle. Where
 * view transitions aren't supported the colours ease across instead, and with
 * reduced motion the switch is immediate.
 */
export function useThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const switchTheme = useCallback(
    (next: Theme, origin?: { x: number; y: number }) => {
      const root = document.documentElement;
      const target = next === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next;
      const current = root.classList.contains("dark") ? "dark" : "light";
      // next-themes applies the class from an effect; the picture of the new
      // page has to show it, so it's set here first.
      const apply = () => {
        root.classList.remove("light", "dark");
        root.classList.add(target);
        root.style.colorScheme = target;
        flushSync(() => setTheme(next));
      };

      if (target === current || matchMedia("(prefers-reduced-motion: reduce)").matches) return setTheme(next);

      if (typeof document.startViewTransition !== "function") {
        root.classList.add("lk-theme-shift");
        apply();
        window.setTimeout(() => root.classList.remove("lk-theme-shift"), 400);
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.classList.add("lk-theme-wipe");
      const transition = document.startViewTransition(apply);
      transition.ready
        .then(() =>
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
            { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
          ),
        )
        .catch(() => {});
      transition.finished.finally(() => root.classList.remove("lk-theme-wipe"));
    },
    [setTheme],
  );

  return { theme, resolvedTheme, switchTheme };
}

/** Where a click happened, for `switchTheme`'s origin. */
export const clickPoint = (e: { clientX: number; clientY: number }) =>
  e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : undefined;
