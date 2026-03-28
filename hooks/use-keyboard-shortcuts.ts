"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onNewTask?: () => void;
  onToggleTimer?: () => void;
  onFocusMode?: () => void;
  onSearch?: () => void;
  onShowShortcuts?: () => void;
  onShortcutGuide?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          handlers.onNewTask?.();
          break;
        case "t":
          e.preventDefault();
          handlers.onToggleTimer?.();
          break;
        case "f":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handlers.onFocusMode?.();
          }
          break;
        case "/":
          e.preventDefault();
          handlers.onSearch?.();
          break;
        case "?":
          e.preventDefault();
          handlers.onShowShortcuts?.();
          handlers.onShortcutGuide?.();
          break;
        case "escape":
          // Escape is handled per-component, not globally
          break;
      }
    },
    [handlers],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUTS = [
  { key: "N", description: "New task" },
  { key: "T", description: "Toggle timer" },
  { key: "F", description: "Focus mode" },
  { key: "/", description: "Search" },
  { key: "?", description: "Show shortcuts" },
  { key: "Esc", description: "Close / Cancel" },
] as const;
