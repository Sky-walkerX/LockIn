"use client";

import dynamic from "next/dynamic";

// CodeMirror is heavy (~200 kB) and only needed once someone clicks
// "Edit notes", so the real editor is code-split out of the subject page's
// initial bundle and fetched on first use.
export const NotesEditor = dynamic(
  () => import("./notes-editor").then((m) => m.NotesEditor),
  {
    ssr: false,
    loading: () => (
      <div className="lk-mono rounded-md border border-input px-3 py-2.5 text-[11px] text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
);
