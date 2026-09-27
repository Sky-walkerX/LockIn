import { useState } from "react";
import { useUpdateMilestone } from "./useMilestones";

// Editing a note's body. Saving closes the editor at once (the cache is patched
// optimistically), so a failed save has nowhere to put the text: it's parked in
// `failed` and the editor reopens with it, rather than the words vanishing.
export function useNoteDraft(milestoneId: string) {
  const update = useUpdateMilestone();
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  return {
    editing,
    /** Text to seed the editor with after a failed save, else null. */
    failed,
    open: () => {
      setFailed(null);
      setEditing(true);
    },
    cancel: () => {
      setEditing(false);
      setFailed(null);
    },
    save: (notes: string) => {
      setEditing(false);
      setFailed(null);
      update.mutate(
        { id: milestoneId, data: { notes } },
        {
          onError: () => {
            setFailed(notes);
            setEditing(true);
          },
        },
      );
    },
  };
}
