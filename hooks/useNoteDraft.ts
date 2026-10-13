import type { Milestone } from "@/app/generated/prisma/browser";
import { useBodyDraft } from "./useBodyDraft";
import { useUpdateMilestone } from "./useMilestones";

// Editing a note's body: see useBodyDraft for what happens when the note
// changes while the editor is open.
export function useNoteDraft(note: { id: string; notes: string }) {
  const update = useUpdateMilestone();
  return useBodyDraft<Milestone>(
    note.notes,
    (notes, base, onError) => update.mutate({ id: note.id, data: { notes, base } }, { onError }),
    (current) => current.notes,
  );
}
