// Moving a note to another section takes its tasks (and their subtasks) along.
// Their indexed chunks have to go: a chunk's content hash covers the text but
// not the subject or the breadcrumb it was embedded with, so without a delete
// the moved note would keep answering as part of its old section. Deleted
// chunks show up as stale, and the normal indexing loop rebuilds them.

type SubtaskIds = { id: string; children?: SubtaskIds[] };
export type NoteForMove = { id: string; tasks: { id: string; subtasks: SubtaskIds[] }[] };
export type ChunkRef = { source: "MILESTONE" | "TASK" | "SUBTASK"; ids: string[] };

/** Every chunk source a note carries with it when it moves. Empty groups are left out. */
export function chunkSourcesOf(note: NoteForMove): ChunkRef[] {
  const subtaskIds: string[] = [];
  const walk = (list: SubtaskIds[]) => {
    for (const s of list) {
      subtaskIds.push(s.id);
      walk(s.children ?? []);
    }
  };
  for (const t of note.tasks) walk(t.subtasks);

  const refs: ChunkRef[] = [{ source: "MILESTONE", ids: [note.id] }];
  if (note.tasks.length > 0) refs.push({ source: "TASK", ids: note.tasks.map((t) => t.id) });
  if (subtaskIds.length > 0) refs.push({ source: "SUBTASK", ids: subtaskIds });
  return refs;
}
