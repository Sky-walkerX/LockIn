// Where a note came from, and whether the user has signed off on it.

/** The source the app writes for notes typed in the browser. */
export const WEB_SOURCE = "web";

const KNOWN: Record<string, string> = {
  "claude-code": "Claude Code",
  claude: "Claude",
  "claude-desktop": "Claude Desktop",
  codex: "Codex",
  cursor: "Cursor",
  chatgpt: "ChatGPT",
  windsurf: "Windsurf",
  highlight: "a highlight",
};

/** True when the note was written by the user in the app (or before sources existed). */
export function isOwnNote(source: string | null | undefined): boolean {
  return !source || source === WEB_SOURCE;
}

/** "Claude Code" for "claude-code"; unknown agents get their id title-cased. */
export function sourceLabel(source: string | null | undefined): string {
  if (isOwnNote(source)) return "you";
  const key = source!.toLowerCase();
  if (KNOWN[key]) return KNOWN[key];
  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** An agent's note the user hasn't witnessed yet. */
export function awaitingWitness(note: { source?: string | null; witnessedAt?: Date | string | null }): boolean {
  return !isOwnNote(note.source) && !note.witnessedAt;
}
