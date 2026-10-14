// Whether a note still stands: replaced by a newer page, about to be (an
// agent proposed a replacement the user hasn't witnessed), or flagged as
// possibly out of date. Pure, shared by the MCP replies and the note page.
//
// "Replaced" is never stored. A note is replaced once a note that says it
// replaces it has been witnessed, so an agent can propose retiring a page but
// only the user retires it, and deleting a rejected proposal undoes it.

export type Replacement = {
  id: string;
  page: number | null;
  title: string;
  source: string | null;
  witnessedAt: Date | string | null;
};

export type StatusInput<R extends Replacement = Replacement> = {
  staleReason: string | null;
  staleAt: Date | string | null;
  staleBy: string | null;
  supersededBy: R[];
};

export type NoteStatus<R extends Replacement = Replacement> =
  | { kind: "replaced"; by: R }
  | { kind: "proposed"; by: R }
  | { kind: "stale"; reason: string; by: string | null; at: Date | string | null }
  | { kind: "current" };

export function noteStatus<R extends Replacement>(note: StatusInput<R>): NoteStatus<R> {
  // The list comes newest first.
  const witnessed = note.supersededBy.filter((r) => r.witnessedAt);
  if (witnessed.length > 0) return { kind: "replaced", by: witnessed[0] };
  if (note.supersededBy.length > 0) return { kind: "proposed", by: note.supersededBy[0] };
  if (note.staleReason) return { kind: "stale", reason: note.staleReason, by: note.staleBy, at: note.staleAt };
  return { kind: "current" };
}

/**
 * SQL that keeps a note only while nothing witnessed replaces it, for the
 * searches. `id` is the column holding the note's id, written by us, never
 * from input.
 */
export const notReplacedSql = (id: string) =>
  `NOT EXISTS (SELECT 1 FROM "Milestone" r WHERE r."supersedesId" = ${id} AND r."witnessedAt" IS NOT NULL)`;
