import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getOrCreateInbox } from "@/lib/subjects/inbox";
import { normalizeRepo, repoMatches } from "./anchor";
import { insertNote } from "./write";

// A coding session files itself into the notebook when it compacts. Claude
// Code summarises the conversation before compacting it, and the LockIn
// plugin's hook hands that summary here, so what the session learned is kept
// even though its context is about to go. When the session ends, the plugin
// has a short background run of Claude write the rest down the same way. One
// note per session: each later compaction, and the end, adds a dated section
// and sends the note back to "To witness".

export const CAPTURE_LIMIT = 30_000;

const when = (at: Date) => at.toISOString().slice(0, 16).replace("T", " ") + " UTC";

/** A folder's own name, as written, from a path. */
export const folderName = (cwd: string | undefined) => cwd?.split(/[\\/]/).filter(Boolean).pop() ?? null;

/** One compaction's section of the note. Pure. */
export function captureSection(summary: string, trigger: string | undefined, at: Date): string {
  const body = summary.trim();
  const text = body.length <= CAPTURE_LIMIT ? body : `${body.slice(0, CAPTURE_LIMIT).trimEnd()}\n\n…(cut short)`;
  const how =
    trigger === "manual"
      ? "compacted with /compact"
      : trigger === "auto"
        ? "compacted automatically"
        : trigger === "end"
          ? "session ended"
          : "compacted";
  return `## ${when(at)}, ${how}\n\n${text}`;
}

/** The note's title, from the folder the session ran in. Pure. */
export function captureTitle(cwd: string | undefined, at: Date): string {
  const day = at.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const folder = folderName(cwd);
  return folder ? `Session in ${folder}, ${day}` : `Session, ${day}`;
}

/**
 * The subject a session's note goes to: the one holding the latest note
 * anchored to the same repo as the session's folder, else the Inbox.
 */
async function placeCapture(userId: string, repo: string | null): Promise<string> {
  if (repo) {
    const anchored = await prisma.milestone.findMany({
      where: { anchorRepo: { not: null }, subject: { userId, isArchived: false, isInbox: false } },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: { anchorRepo: true, subjectId: true },
    });
    const hit = anchored.find((m) => repoMatches(m.anchorRepo, repo));
    if (hit) return hit.subjectId;
  }
  return getOrCreateInbox(userId);
}

type Captured = { id: string; title: string; page: number | null; subjectId: string; added: boolean };

/** Adds a section to the session's note in one statement, so two at once both land. */
async function addSection(key: string, section: string): Promise<Captured | null> {
  const [row] = await prisma.$queryRaw<Omit<Captured, "added">[]>`
    UPDATE "Milestone"
    SET "notes" = "notes" || ${`\n\n${section}`}, "witnessedAt" = NULL, "updatedAt" = (NOW() AT TIME ZONE 'UTC')
    WHERE "captureKey" = ${key}
    RETURNING "id", "title", "page", "subjectId"`;
  return row ? { ...row, added: true } : null;
}

export async function captureSession(
  userId: string,
  source: string,
  input: { sessionId: string; summary: string; cwd?: string; trigger?: string },
  at = new Date(),
): Promise<Captured> {
  const key = `${userId}:${input.sessionId}`;
  const section = captureSection(input.summary, input.trigger, at);
  const existing = await addSection(key, section);
  if (existing) return existing;

  const repo = normalizeRepo(input.cwd);
  const subjectId = await placeCapture(userId, repo);
  try {
    const note = await insertNote(userId, subjectId, {
      title: captureTitle(input.cwd, at),
      notes: section,
      source,
      anchor: { repo },
      captureKey: key,
    });
    return { id: note.id, title: note.title, page: note.page, subjectId: note.subjectId, added: false };
  } catch (e) {
    // The same session's first two compactions at once: the other one made
    // the note, so this one adds to it.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const added = await addSection(key, section);
      if (added) return added;
    }
    throw e;
  }
}
