import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { matchSubject } from "@/lib/notes/write";
import { normalizeRepo, repoMatches } from "@/lib/notes/anchor";
import { clampCard, type CardInput, type PinnedPage } from "./card";

// Batons: saving one, finding the one to pick up, and marking it taken. At
// most one is open per subject or repo: a newer baton for the same work
// supersedes the last, so a pickup never lands on an old one.

const BATON = {
  subject: { select: { id: true, title: true, isInbox: true } },
  task: { select: { id: true, title: true, isCompleted: true } },
  note: { select: { id: true, page: true, title: true } },
} satisfies Prisma.HandoffInclude;

export type SaveInput = CardInput & {
  subject?: string;
  taskId?: string;
  noteId?: string;
  repo?: string;
  branch?: string;
  commit?: string;
};

export type SaveRefused = "no-subject" | "no-task" | "no-note";

/**
 * Saves a baton from `source`, closing the open one for the same subject or
 * repo. The task, note and subject must be the user's; a subject named that
 * doesn't exist is refused rather than guessed.
 */
export async function saveHandoff(userId: string, source: string, input: SaveInput) {
  const [subjects, task, note] = await Promise.all([
    input.subject ? prisma.subject.findMany({ where: { userId, isArchived: false }, select: { id: true, title: true, isInbox: true } }) : null,
    input.taskId ? prisma.task.findFirst({ where: { id: input.taskId, userId }, select: { id: true, subjectId: true } }) : null,
    input.noteId ? prisma.milestone.findFirst({ where: { id: input.noteId, subject: { userId } }, select: { id: true, subjectId: true } }) : null,
  ]);
  if (input.taskId && !task) return "no-task" satisfies SaveRefused;
  if (input.noteId && !note) return "no-note" satisfies SaveRefused;
  let subjectId: string | null = null;
  if (subjects) {
    const hit = matchSubject(subjects, input.subject!) ?? (/^inbox$/i.test(input.subject!.trim()) ? subjects.find((s) => s.isInbox) : null);
    if (!hit) return "no-subject" satisfies SaveRefused;
    subjectId = hit.id;
  }
  subjectId ??= task?.subjectId ?? note?.subjectId ?? null;
  const repo = normalizeRepo(input.repo);

  const same: Prisma.HandoffWhereInput[] = [];
  if (subjectId) same.push({ subjectId });
  if (repo) same.push({ repo });
  if (same.length === 0) same.push({ subjectId: null, repo: null });

  const [, baton] = await prisma.$transaction([
    prisma.handoff.updateMany({ where: { userId, status: "OPEN", OR: same }, data: { status: "SUPERSEDED" } }),
    prisma.handoff.create({
      data: {
        userId,
        source,
        ...clampCard(input),
        subjectId,
        taskId: task?.id ?? null,
        noteId: note?.id ?? null,
        repo,
        branch: input.branch?.trim() || null,
        commit: input.commit?.trim() || null,
      },
      include: BATON,
    }),
  ]);
  return baton;
}

export type Find = { subject?: string; repo?: string };

/**
 * The open baton to pick up: for the named subject, else for the repo (a
 * folder name matches its repo), else the newest of all. Null when none is open.
 */
export async function latestOpen(userId: string, find: Find) {
  const open = await prisma.handoff.findMany({
    where: { userId, status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: BATON,
  });
  if (find.subject?.trim()) {
    const q = find.subject.trim();
    const subjects = open.flatMap((h) => (h.subject ? [h.subject] : []));
    const hit = matchSubject(subjects, q) ?? (/^inbox$/i.test(q) ? subjects.find((s) => s.isInbox) : null);
    return hit ? open.find((h) => h.subjectId === hit.id)! : null;
  }
  const repo = normalizeRepo(find.repo);
  if (repo) return open.find((h) => repoMatches(h.repo, repo)) ?? null;
  return open[0] ?? null;
}

/** Marks a baton taken by `by` (an agent, or "web" when the user closes it). */
export async function markPickedUp(userId: string, id: string, by: string) {
  const { count } = await prisma.handoff.updateMany({
    where: { id, userId, status: "OPEN" },
    data: { status: "PICKED_UP", pickedUpAt: new Date(), pickedUpBy: by },
  });
  return count > 0;
}

/** The pages a baton pins, in the order it gave them. */
export async function pinnedPages(userId: string, pages: number[]): Promise<PinnedPage[]> {
  if (pages.length === 0) return [];
  const rows = await prisma.milestone.findMany({
    where: { page: { in: pages }, subject: { userId } },
    select: { id: true, page: true, title: true, notes: true },
  });
  return pages.flatMap((p) => rows.filter((r) => r.page === p));
}

/** Recent batons for the app: the open ones first, then the latest taken. */
export async function listHandoffs(userId: string, limit = 10) {
  return prisma.handoff.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: BATON,
  });
}

export type BatonRow = NonNullable<Awaited<ReturnType<typeof latestOpen>>>;
