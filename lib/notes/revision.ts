// Telling whether a note's body changed between opening the editor and saving,
// and what to do when it did. The editor sends the whole body, so without this
// a save would erase whatever an agent added to the note in the meantime.

/**
 * A short fingerprint of a note's body (cyrb53). The editor sends the one for
 * the text it started from, and the server compares it with the text it holds.
 * It only has to tell two versions of one note apart, so it isn't a
 * cryptographic hash; that also keeps it working on a self-hosted copy served
 * over plain http, where the browser has no crypto.subtle.
 */
export function bodyRev(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${text.length.toString(36)}-${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}`;
}

/**
 * The user's edit with what was added to the note while they were writing.
 * Agents add to the end of a note (lib/notes/append.ts), so when the note now
 * is the text the edit started from plus more, that addition goes under the
 * user's text and nothing is lost. Null when the note changed any other way:
 * that needs the user to look.
 */
export function mergeAppended(base: string, current: string, mine: string): string | null {
  const stem = base.trim();
  const now = current.trimStart();
  if (!now.startsWith(stem)) return null;
  const added = now.slice(stem.length).trim();
  if (!added) return mine;
  return mine.trim() ? `${mine.trimEnd()}\n\n${added}` : added;
}
