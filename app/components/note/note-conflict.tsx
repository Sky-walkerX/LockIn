import { Markdown } from "@/app/components/subject/markdown";

// Shown above the editor when a save was refused because the note changed
// under the edit and the change couldn't be merged (hooks/useNoteDraft.ts).
// The editor still holds the user's text; the newer note is a click away.
export function NoteConflict({ note }: { note: { notes: string; page: number | null } }) {
  return (
    <div className="lk-note-conflict" role="alert">
      <p>
        <b>This note changed while you were editing.</b> Your text is in the editor. Saving it replaces the newer
        version, so copy across anything you want to keep first.
      </p>
      <details>
        <summary>Show the note as it is now</summary>
        <div className="lk-reading">
          <Markdown page={note.page}>{note.notes}</Markdown>
        </div>
      </details>
    </div>
  );
}
