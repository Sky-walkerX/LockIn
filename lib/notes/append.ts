import { format } from "date-fns";

/**
 * Appended rather than replaced: a note is the user's, and anything filed into
 * it from elsewhere (a chat answer, a focus-session recap, a highlight) is an
 * addition to it, never a substitution for what they already wrote.
 */
export function appendNote(existing: string, text: string, label: string, when: Date | string = new Date()): string {
  // Local date, not UTC: a note stamped "yesterday" because the user is east
  // of Greenwich at 2am is wrong in the only timezone that matters to them.
  // The server doesn't share the user's zone, so it passes their date already
  // worked out (yyyy-MM-dd, lib/zone.ts localDay).
  const stamp = typeof when === "string" ? when : format(when, "yyyy-MM-dd");
  const block = `---\n*${label} · ${stamp}*\n\n${text.trim()}`;
  return existing.trim() ? `${existing.trim()}\n\n${block}` : block;
}

/** Plain continuation, for an author adding to their own note. */
export function continueNote(existing: string, text: string): string {
  return existing.trim() ? `${existing.trim()}\n\n${text.trim()}` : text.trim();
}
