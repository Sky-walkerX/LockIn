import { Markdown } from "@/app/components/subject/markdown";

// Shown above the editor when a save was refused because the note changed
// under the edit and the change couldn't be merged (hooks/useBodyDraft.ts).
// The editor still holds the user's text; the newer note is a click away.
// `what` names the thing for a task's or subtask's notes ("These notes").
export function NoteConflict({
  note,
  what = "This note",
}: {
  note: { notes: string; page: number | null };
  what?: "This note" | "These notes";
}) {
  return (
    <div className="lk-note-conflict" role="alert">
      <p>
        <b>{what} changed while you were editing.</b> Your text is in the editor. Saving it replaces the newer
        version, so copy across anything you want to keep first.
      </p>
      <details>
        <summary>{what === "This note" ? "Show the note as it is now" : "Show the notes as they are now"}</summary>
        <div className="lk-reading">
          <Markdown page={note.page}>{note.notes}</Markdown>
        </div>
      </details>
    </div>
  );
}
