import { useRef, useState } from "react";
import type { Milestone } from "@/app/generated/prisma/browser";
import { ApiError } from "@/lib/fetcher";
import { bodyRev, mergeAppended } from "@/lib/notes/revision";
import { useUpdateMilestone } from "./useMilestones";

// Editing a note's body. Saving closes the editor at once (the cache is patched
// optimistically), so a failed save has nowhere to put the text: it's parked in
// `failed` and the editor reopens with it, rather than the words vanishing.
//
// A save says which text it started from, and the server refuses it if the
// note has changed since: an agent may have added to it while the editor was
// open. What was added to the end is kept under the user's text and saved
// again without asking. Any other change reopens the editor with `conflict`
// set, and the next save is the user's decision to replace the newer version.
export function useNoteDraft(note: { id: string; notes: string }) {
  const update = useUpdateMilestone();
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  // The body the edit started from.
  const base = useRef(note.notes);

  const send = (notes: string, merges: number) => {
    update.mutate(
      { id: note.id, data: { notes, base: bodyRev(base.current) } },
      {
        onError: (error) => {
          const current =
            error instanceof ApiError && error.status === 409 ? (error.body?.current as Milestone | undefined) : undefined;
          if (current) {
            const merged = merges > 0 ? mergeAppended(base.current, current.notes, notes) : null;
            base.current = current.notes;
            if (merged !== null) return send(merged, merges - 1);
            setConflict(true);
          }
          setFailed(notes);
          setEditing(true);
        },
      },
    );
  };

  return {
    editing,
    /** Text to seed the editor with after a failed save, else null. */
    failed,
    /** The note changed under this edit in a way that can't be merged; the
     *  editor holds the user's text and the page shows the newer note. */
    conflict,
    open: () => {
      base.current = note.notes;
      setFailed(null);
      setConflict(false);
      setEditing(true);
    },
    cancel: () => {
      setEditing(false);
      setFailed(null);
      setConflict(false);
    },
    save: (notes: string) => {
      setEditing(false);
      setFailed(null);
      setConflict(false);
      // An agent can add to the note more than once during one edit.
      send(notes, 3);
    },
  };
}
