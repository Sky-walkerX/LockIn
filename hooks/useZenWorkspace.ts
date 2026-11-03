"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useStoredValue } from "@/hooks/useStoredValue";
import { latestNotePage } from "@/hooks/useNotes";
import { WORKSPACE_KEY, isWorkspacePath } from "@/lib/zen-workspace";


// The Zen workspace: a section's notes, and the Inbox, written and read on
// Zen's near-black paper with a slim black sidebar of sections, for as long
// as it's on. It's remembered per browser, and it changes how the notebook
// looks only where notes are; Home, Plan and the rest look as they always do.
// While it's showing, <html> carries WORKSPACE_CLASS (globals.css does the rest).

export function useZenWorkspace() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const qc = useQueryClient();
  const [stored, setStored] = useStoredValue(WORKSPACE_KEY, "off");
  const on = stored === "zen";
  const active = on && isWorkspacePath(pathname);

  // Turning it on away from any notes opens the note written last, so the
  // workspace shows at once instead of waiting for a section to be picked.
  const toggle = useCallback(async () => {
    setStored(on ? "off" : "zen");
    if (on || isWorkspacePath(window.location.pathname)) return;
    const page = await latestNotePage(qc);
    if (page) router.push(page);
  }, [on, setStored, qc, router]);

  return { on, active, toggle };
}
