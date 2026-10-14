// A baton, as the next agent reads it. Agents hand work on when they hit a
// usage cap or the user switches tools mid-feature, so the card says only
// what the next one needs to carry on: the goal, where it stands, what was
// ruled out, the exact next step, and which pages to read first. Each field
// is clipped rather than refused, so a handoff written at the last moment
// never fails; the whole card stays around 300 tokens. Pure, so it's tested
// alone.

import { sourceLabel } from "@/lib/notes/source";
import { shortCommit } from "@/lib/notes/anchor";

export const CARD = { goal: 160, state: 400, tried: 110, triedCount: 4, next: 200, nextAt: 100, pages: 5 } as const;
/** How much of each pinned page comes with a pickup, and of all of them together. */
export const PAGE_TEXT = { each: 1200, total: 4000 } as const;

export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export type CardInput = { goal: string; state: string; tried?: string[]; next: string; nextAt?: string | null; pages?: number[] };

/** The fields as stored: clipped, blanks dropped, pages once each. */
export function clampCard(input: CardInput) {
  return {
    goal: clip(input.goal, CARD.goal),
    state: clip(input.state, CARD.state),
    tried: (input.tried ?? []).map((t) => clip(t, CARD.tried)).filter(Boolean).slice(0, CARD.triedCount),
    next: clip(input.next, CARD.next),
    nextAt: input.nextAt?.trim() ? clip(input.nextAt, CARD.nextAt) : null,
    pages: [...new Set((input.pages ?? []).filter((p) => Number.isInteger(p) && p > 0))].slice(0, CARD.pages),
  };
}

export type Baton = {
  id: string;
  source: string;
  goal: string;
  state: string;
  tried: string[];
  next: string;
  nextAt: string | null;
  pages: number[];
  repo: string | null;
  branch: string | null;
  commit: string | null;
  createdAt: Date | string;
  subject: { title: string; isInbox: boolean } | null;
  task: { id: string; title: string; isCompleted: boolean } | null;
  note: { id: string; page: number | null; title: string } | null;
};

export type PinnedPage = { id: string; page: number | null; title: string; notes: string };

const when = (d: Date | string) => new Date(d).toISOString().slice(0, 16).replace("T", " ") + " UTC";

/** The pinned pages' text, each cut short, until the total runs out. */
export function clipPages(pages: PinnedPage[]): string[] {
  let left: number = PAGE_TEXT.total;
  const out: string[] = [];
  for (const p of pages) {
    if (left <= 0) break;
    const max = Math.min(PAGE_TEXT.each, left);
    const body = p.notes.trim();
    const text = body.length <= max ? body : `${body.slice(0, max).trimEnd()}… (get_note ${p.id} for the rest)`;
    left -= Math.min(body.length, max);
    out.push(`## ${p.page != null ? `p. ${p.page}: ` : ""}${p.title} (note ${p.id})\n${text || "(empty)"}`);
  }
  return out;
}

/** The card as the agent picking it up reads it. */
export function formatHandoff(baton: Baton, pinned: PinnedPage[] = [], url: string | null = null): string {
  const where = [
    baton.subject ? `Subject: ${baton.subject.isInbox ? "the Inbox" : baton.subject.title}` : null,
    baton.repo
      ? `Repo: ${baton.repo}${baton.branch ? ` on ${baton.branch}` : ""}${baton.commit ? ` @ ${shortCommit(baton.commit)}` : ""}`
      : null,
    baton.task ? `Task: "${baton.task.title}" (task ${baton.task.id}${baton.task.isCompleted ? ", done" : ""})` : null,
    baton.note ? `Note: ${baton.note.page != null ? `p. ${baton.note.page}, ` : ""}"${baton.note.title}" (note ${baton.note.id})` : null,
  ].filter(Boolean);
  const lines = [
    `# Baton from ${sourceLabel(baton.source)}, left ${when(baton.createdAt)}`,
    ...where,
    ...(url ? [url] : []),
    "",
    `Goal: ${baton.goal}`,
    `Where it stands: ${baton.state}`,
  ];
  if (baton.tried.length > 0) lines.push("Tried and ruled out:", ...baton.tried.map((t) => `- ${t}`));
  lines.push(`Next: ${baton.next}${baton.nextAt ? ` (start at ${baton.nextAt})` : ""}`);
  const read = clipPages(pinned);
  if (read.length > 0) lines.push("", "Read first:", "", read.join("\n\n"));
  else if (baton.pages.length > 0) lines.push(`Read first: ${baton.pages.map((p) => `p. ${p}`).join(", ")}`);
  return lines.join("\n");
}
