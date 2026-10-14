import prisma from "@/lib/prisma";
import { takePage } from "./page";
import { Prisma, type Milestone } from "@/app/generated/prisma/client";
import { cleanFiles, normalizeRepo } from "./anchor";
import { getOrCreateInbox } from "@/lib/subjects/inbox";
import { appendNote, continueNote } from "./append";
import { chunkSourcesOf } from "./move";
import { replaceOnce } from "./edit";
import { bodyRev } from "./revision";
import { WEB_SOURCE } from "./source";

// Writing notes, shared by the app's API routes and the MCP server so the two
// can't drift: where a note lands, its order, and who has to witness it.

type SubjectRef = { id: string; title: string };

/**
 * The subject a caller meant, by id or by title (ignoring case and spacing).
 * Agents usually say "Rust", not an id. Null when nothing matches.
 */
export function matchSubject<S extends SubjectRef>(subjects: S[], query: string): S | null {
  const q = query.trim();
  if (!q) return null;
  const byId = subjects.find((s) => s.id === q);
  if (byId) return byId;
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
  return subjects.find((s) => norm(s.title) === norm(q)) ?? null;
}

export type Placement = { subjectId: string; subjectTitle: string; isInbox: boolean; requested: string | null };

/**
 * Where a new note goes: the named subject when it exists, else the Inbox. A
 * name that matches nothing is reported back (`requested`) rather than
 * creating a subject, so an agent's typo can't sprawl the notebook.
 */
export async function placeNote(userId: string, subject: string | undefined): Promise<Placement> {
  const requested = subject?.trim() || null;
  if (requested) {
    const subjects = await prisma.subject.findMany({
      where: { userId, isArchived: false, isInbox: false },
      select: { id: true, title: true },
    });
    const hit = matchSubject(subjects, requested);
    if (hit) return { subjectId: hit.id, subjectTitle: hit.title, isInbox: false, requested };
  }
  return { subjectId: await getOrCreateInbox(userId), subjectTitle: "Inbox", isInbox: true, requested };
}

/** The order a note appended to the end of a subject gets. */
export async function nextOrder(subjectId: string): Promise<number> {
  const last = await prisma.milestone.findFirst({
    where: { subjectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return last ? last.order + 1 : 0;
}

/**
 * Insert a note at the end of its subject (unless `order` is given), on the
 * notebook's next page. Notes typed in the app are witnessed as they're
 * written; anyone else's wait. The caller has already checked the subject
 * belongs to the user.
 */
export type AnchorInput = { repo?: string | null; commit?: string | null; commitAt?: Date | null; files?: string[] };

/** The columns an anchor is stored in, normalised. Empty when nothing usable was given. */
function anchorData(anchor: AnchorInput | undefined) {
  if (!anchor) return {};
  const repo = normalizeRepo(anchor.repo);
  const commit = anchor.commit?.trim() || null;
  if (!repo && !commit) return {};
  // A date belongs to its commit: without one it means nothing.
  const commitAt = commit ? (anchor.commitAt ?? null) : null;
  return { anchorRepo: repo, anchorCommit: commit, anchorCommitAt: commitAt, anchorFiles: cleanFiles(anchor.files) };
}

export async function insertNote(
  userId: string,
  subjectId: string,
  input: {
    title: string;
    notes?: string;
    order?: number;
    source?: string;
    anchor?: AnchorInput;
    supersedesId?: string;
    captureKey?: string;
  },
): Promise<Milestone> {
  const source = input.source ?? WEB_SOURCE;
  const [order, page] = await Promise.all([input.order ?? nextOrder(subjectId), takePage(userId)]);
  return prisma.milestone.create({
    data: {
      subjectId,
      page,
      title: input.title,
      notes: input.notes ?? "",
      order,
      source,
      witnessedAt: source === WEB_SOURCE ? new Date() : null,
      ...anchorData(input.anchor),
      supersedesId: input.supersedesId,
      captureKey: input.captureKey,
    },
  });
}

/**
 * A new note that replaces one of the user's notes, in the same subject and
 * about the same code unless it says otherwise. The old note stays as it is:
 * it's retired only when the user witnesses this one (lib/notes/status.ts).
 * Null when the old note isn't the user's.
 */
export async function supersedeNote(
  userId: string,
  oldId: string,
  input: { title: string; notes: string; source: string; anchor?: AnchorInput },
) {
  const old = await prisma.milestone.findFirst({
    where: { id: oldId, subject: { userId } },
    select: {
      id: true,
      page: true,
      title: true,
      subjectId: true,
      anchorRepo: true,
      anchorCommit: true,
      anchorCommitAt: true,
      anchorFiles: true,
    },
  });
  if (!old) return null;
  // What the agent gives wins, field by field; the rest carries over. A new
  // commit brings its own date, or none.
  const given = input.anchor ?? {};
  const anchor = {
    repo: given.repo || old.anchorRepo,
    commit: given.commit || old.anchorCommit,
    commitAt: given.commit ? (given.commitAt ?? null) : old.anchorCommitAt,
    files: given.files?.length ? given.files : old.anchorFiles,
  };
  const note = await insertNote(userId, old.subjectId, {
    title: input.title,
    notes: input.notes,
    source: input.source,
    anchor,
    supersedesId: old.id,
  });
  return { note, old };
}

export type LinkRefused = "missing" | "not-yours" | "old-missing" | "same" | "loop";

/**
 * An agent says a note it recorded replaces an older one, after saving it
 * (save_note shows it the notes that look related). The note goes back to
 * "awaiting witness" so the user signs off on the retirement too: the old
 * page retires only when they do (lib/notes/status.ts).
 */
export async function linkReplacement(userId: string, noteId: string, oldId: string, source: string) {
  if (noteId === oldId) return "same" satisfies LinkRefused;
  const [note, old] = await Promise.all([
    prisma.milestone.findFirst({ where: { id: noteId, subject: { userId } }, select: { id: true, source: true, title: true } }),
    prisma.milestone.findFirst({
      where: { id: oldId, subject: { userId } },
      select: { id: true, page: true, title: true, supersedesId: true, anchorCommit: true, anchorCommitAt: true },
    }),
  ]);
  if (!note) return "missing" satisfies LinkRefused;
  if (note.source !== source) return "not-yours" satisfies LinkRefused;
  if (!old) return "old-missing" satisfies LinkRefused;
  if (old.supersedesId === note.id) return "loop" satisfies LinkRefused;
  const linked = await prisma.milestone.update({
    where: { id: note.id },
    data: { supersedesId: old.id, witnessedAt: null },
    include: WITH_SUBJECT,
  });
  return { note: linked, old };
}

type MetaRow = { id: string; title: string; subjectId: string; subjectTitle: string; isInbox: boolean };

/**
 * Changes a note's anchor and stale flag without touching what it says, so
 * `updatedAt` stays put: checking a note isn't writing it, and it shouldn't
 * jump to the top of the recent notes. Null when the note isn't the user's.
 */
async function setNoteMeta(userId: string, noteId: string, set: Prisma.Sql): Promise<MetaRow | null> {
  const [row] = await prisma.$queryRaw<MetaRow[]>`
    UPDATE "Milestone" m SET ${set}
    FROM "Subject" s
    WHERE m."id" = ${noteId} AND s."id" = m."subjectId" AND s."userId" = ${userId}
    RETURNING m."id", m."title", m."subjectId", s."title" AS "subjectTitle", s."isInbox"`;
  return row ?? null;
}

/**
 * Someone checked the note against the code and it still holds: it's now
 * true as of `commit`, and any flag on it is cleared. A note without an
 * anchor gets one this way. `by` is the agent, or "web" for the user.
 */
export function confirmNote(userId: string, noteId: string, by: string, anchor: AnchorInput = {}) {
  const data = anchorData(anchor);
  const sets = [
    Prisma.sql`"checkedAt" = now(), "checkedBy" = ${by}, "staleReason" = NULL, "staleAt" = NULL, "staleBy" = NULL`,
  ];
  if (data.anchorCommit) {
    sets.push(Prisma.sql`"anchorCommit" = ${data.anchorCommit}, "anchorCommitAt" = ${data.anchorCommitAt}::timestamp`);
  }
  if (data.anchorRepo) sets.push(Prisma.sql`"anchorRepo" = ${data.anchorRepo}`);
  if (data.anchorFiles?.length) sets.push(Prisma.sql`"anchorFiles" = ${data.anchorFiles}::text[]`);
  return setNoteMeta(userId, noteId, Prisma.join(sets, ", "));
}

/** An agent thinks the note may no longer hold, and says why, for the user to look at. */
export function flagStale(userId: string, noteId: string, by: string, reason: string) {
  return setNoteMeta(userId, noteId, Prisma.sql`"staleReason" = ${reason}, "staleAt" = now(), "staleBy" = ${by}`);
}

/** The user looked at a flagged note and it's fine as it is. */
export function dismissStale(userId: string, noteId: string) {
  return setNoteMeta(userId, noteId, Prisma.sql`"staleReason" = NULL, "staleAt" = NULL, "staleBy" = NULL`);
}

const WITH_SUBJECT = { subject: { select: { id: true, title: true, isInbox: true } } } as const;

type HeldNote = { id: string; title: string; notes: string; source: string | null };
type NoteChange<T> = { write: { title?: string; notes?: string; witnessedAt?: null } } | { leave: T };

/**
 * Changes one of the user's notes from what it says now, holding its row from
 * the read to the write. A note's body is written whole, so two writers at
 * once (two agents, or an agent and the editor) would otherwise both start
 * from the same text and the second would erase the first. With the row held
 * they take turns, and each builds on what the other wrote.
 *
 * `change` returns what to write, or `leave` with a reason to write nothing.
 * The lock lasts for one short transaction, which the transaction pooler
 * allows (as in lib/subjects/inbox.ts).
 */
async function rewriteNote<T>(userId: string, noteId: string, change: (note: HeldNote) => NoteChange<T>) {
  return prisma.$transaction(async (tx) => {
    const [note] = await tx.$queryRaw<HeldNote[]>`
      SELECT m."id", m."title", m."notes", m."source"
      FROM "Milestone" m
      JOIN "Subject" s ON s."id" = m."subjectId"
      WHERE m."id" = ${noteId} AND s."userId" = ${userId}
      FOR UPDATE OF m`;
    if (!note) return { kind: "missing" as const };
    const next = change(note);
    if ("leave" in next) return { kind: "left" as const, why: next.leave };
    const written = await tx.milestone.update({ where: { id: note.id }, data: next.write, include: WITH_SUBJECT });
    return { kind: "written" as const, note: written };
  });
}

/**
 * Add to the end of a note, never replacing what's there. An agent adding to
 * a note it recorded just continues it: the note already says who wrote it.
 * Anywhere else the addition gets a labelled block ("From Codex · 2026-10-02")
 * so it can't pass for the user's own writing. Null when the note isn't the user's.
 */
export async function appendToNote(userId: string, noteId: string, text: string, source: string, label: string) {
  const result = await rewriteNote(userId, noteId, (note) => ({
    write: { notes: note.source === source ? continueNote(note.notes, text) : appendNote(note.notes, text, label) },
  }));
  return result.kind === "written" ? result.note : null;
}

/**
 * A labelled block at the end of a note, for what the app files into one: a
 * chat answer ("from chat · 2026-10-02"), a highlight. `day` is the user's own
 * date. Null when the note isn't the user's.
 */
export async function appendBlockToNote(userId: string, noteId: string, text: string, label: string, day: string) {
  const result = await rewriteNote(userId, noteId, (note) => ({ write: { notes: appendNote(note.notes, text, label, day) } }));
  return result.kind === "written" ? result.note : null;
}

/**
 * The editor's save: the whole body, written only if the note still says what
 * the edit started from (`base`, its bodyRev). Otherwise someone added to it
 * or changed it meanwhile, and the caller gets the note as it stands instead
 * of overwriting them.
 */
export async function saveNoteBody(userId: string, noteId: string, notes: string, base: string) {
  const result = await rewriteNote(userId, noteId, (note) =>
    bodyRev(note.notes) === base ? { write: { notes } } : { leave: "changed" as const },
  );
  if (result.kind === "written") return { kind: "saved" as const, note: result.note };
  if (result.kind === "missing") return result;
  const current = await prisma.milestone.findFirst({ where: { id: noteId, subject: { userId } } });
  return current ? { kind: "conflict" as const, current } : { kind: "missing" as const };
}

/**
 * File a note under another subject (or the Inbox). Its tasks go with it, it
 * lands at the end of the target's notes, and its indexed chunks are dropped so
 * they rebuild under the new subject.
 */
export async function moveNote(
  userId: string,
  id: string,
  subjectId: string,
): Promise<Milestone | "note-missing" | "subject-missing"> {
  const [note, target, last] = await Promise.all([
    prisma.milestone.findFirst({
      where: { id, subject: { userId } },
      select: {
        id: true,
        subjectId: true,
        tasks: { select: { id: true, subtasks: { select: { id: true, children: { select: { id: true } } } } } },
      },
    }),
    prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } }),
    prisma.milestone.findFirst({ where: { subjectId }, orderBy: { order: "desc" }, select: { order: true } }),
  ]);
  if (!note) return "note-missing";
  if (!target) return "subject-missing";
  if (note.subjectId === subjectId) return (await prisma.milestone.findUnique({ where: { id } }))!;

  const chunks = chunkSourcesOf(note);
  const [moved] = await prisma.$transaction([
    prisma.milestone.update({ where: { id }, data: { subjectId, order: last ? last.order + 1 : 0 } }),
    prisma.task.updateMany({ where: { milestoneId: id }, data: { subjectId } }),
    prisma.noteChunk.deleteMany({
      where: { userId, OR: chunks.map((c) => ({ source: c.source, sourceId: { in: c.ids } })) },
    }),
  ]);
  return moved;
}

export type NoteEdit = { title?: string; oldText?: string; newText?: string };

/**
 * An agent's edit to a note it recorded: a new title, one passage replaced,
 * or both. Anyone else's note is append-only for it. The edit sends the note
 * back to the user to witness again.
 */
type EditRefused = { kind: "not-yours"; title: string } | { kind: "no-match"; matches: number };

export async function editAgentNote(userId: string, noteId: string, source: string, edit: NoteEdit) {
  const result = await rewriteNote<EditRefused>(userId, noteId, (note) => {
    if (note.source !== source) return { leave: { kind: "not-yours", title: note.title } };
    let notes = note.notes;
    if (edit.oldText !== undefined) {
      const replaced = replaceOnce(notes, edit.oldText, edit.newText ?? "");
      if (!replaced.ok) return { leave: { kind: "no-match", matches: replaced.matches } };
      notes = replaced.text;
    }
    return { write: { title: edit.title ?? note.title, notes, witnessedAt: null } };
  });
  if (result.kind === "missing") return result;
  if (result.kind === "left") return result.why;
  return { kind: "edited" as const, note: result.note };
}
