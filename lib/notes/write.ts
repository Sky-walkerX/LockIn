import prisma from "@/lib/prisma";
import type { Milestone } from "@/app/generated/prisma/client";
import { getOrCreateInbox } from "@/lib/subjects/inbox";
import { appendNote } from "./append";
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
 * Insert a note at the end of its subject (unless `order` is given). Notes
 * typed in the app are witnessed as they're written; anyone else's wait.
 * The caller has already checked the subject belongs to the user.
 */
export async function insertNote(
  subjectId: string,
  input: { title: string; notes?: string; order?: number; source?: string },
): Promise<Milestone> {
  const source = input.source ?? WEB_SOURCE;
  const order = input.order ?? (await nextOrder(subjectId));
  return prisma.milestone.create({
    data: {
      subjectId,
      title: input.title,
      notes: input.notes ?? "",
      order,
      source,
      witnessedAt: source === WEB_SOURCE ? new Date() : null,
    },
  });
}

/**
 * Add a labelled block to the end of a note ("From Codex · 2026-10-02"), never
 * replacing what's there. Null when the note isn't the user's.
 */
export async function appendToNote(userId: string, noteId: string, text: string, label: string) {
  const note = await prisma.milestone.findFirst({
    where: { id: noteId, subject: { userId } },
    select: { id: true, notes: true },
  });
  if (!note) return null;
  return prisma.milestone.update({
    where: { id: note.id },
    data: { notes: appendNote(note.notes, text, label) },
    include: { subject: { select: { id: true, title: true, isInbox: true } } },
  });
}
