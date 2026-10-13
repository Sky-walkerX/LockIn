import prisma from "@/lib/prisma";
import { takePage } from "./page";
import type { Milestone } from "@/app/generated/prisma/client";
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
export async function insertNote(
  userId: string,
  subjectId: string,
  input: { title: string; notes?: string; order?: number; source?: string },
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
    },
  });
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
