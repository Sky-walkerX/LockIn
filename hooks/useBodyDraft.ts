import { useRef, useState } from "react";
import { ApiError } from "@/lib/fetcher";
import { bodyRev, mergeAppended } from "@/lib/notes/revision";

// Editing a body of markdown that an agent may add to meanwhile: a note's, or
// the notes on a task or subtask. Saving closes the editor at once (the cache
// is patched optimistically), so a failed save has nowhere to put the text:
// it's parked in `failed` and the editor reopens with it, rather than the
// words vanishing.
//
// A save says which text it started from, and the server refuses it if the
// body has changed since. What was added to the end is kept under the user's
// text and saved again without asking. Any other change reopens the editor
// with `conflict` set, and the next save is the user's decision to replace
// the newer version.
//
// `write` sends the text with the revision it builds on; `bodyOf` reads the
// body out of the record a refusal carries back.
export function useBodyDraft<Row>(
  body: string,
  write: (text: string, base: string, onError: (error: unknown) => void) => void,
  bodyOf: (current: Row) => string,
) {
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  // The body the edit started from.
  const base = useRef(body);

  const send = (text: string, merges: number) => {
    write(text, bodyRev(base.current), (error) => {
      const current = error instanceof ApiError && error.status === 409 ? (error.body?.current as Row | undefined) : undefined;
      if (current) {
        const now = bodyOf(current);
        const merged = merges > 0 ? mergeAppended(base.current, now, text) : null;
        base.current = now;
        if (merged !== null) return send(merged, merges - 1);
        setConflict(true);
      }
      setFailed(text);
      setEditing(true);
    });
  };

  return {
    editing,
    /** Text to seed the editor with after a failed save, else null. */
    failed,
    /** The body changed under this edit in a way that can't be merged; the
     *  editor holds the user's text and the page shows the newer version. */
    conflict,
    open: () => {
      base.current = body;
      setFailed(null);
      setConflict(false);
      setEditing(true);
    },
    cancel: () => {
      setEditing(false);
      setFailed(null);
      setConflict(false);
    },
    save: (text: string) => {
      setEditing(false);
      setFailed(null);
      setConflict(false);
      // An agent can add to it more than once during one edit.
      send(text, 3);
    },
  };
}
