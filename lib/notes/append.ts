import { format } from "date-fns";

/**
 * Appended rather than replaced: a note is the user's, and anything filed into
 * it from elsewhere (a chat answer, a focus-session recap, a highlight) is an
 * addition to it, never a substitution for what they already wrote.
 */
export function appendNote(existing: string, text: string, label: string, now: Date = new Date()): string {
  // Local date, not UTC: a note stamped "yesterday" because the user is east
  // of Greenwich at 2am is wrong in the only timezone that matters to them.
  const stamp = format(now, "yyyy-MM-dd");
  const block = `---\n*${label} · ${stamp}*\n\n${text.trim()}`;
  return existing.trim() ? `${existing.trim()}\n\n${block}` : block;
}
