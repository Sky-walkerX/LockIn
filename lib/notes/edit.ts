// An agent's edit to a note: one exact passage swapped for another, the way
// coding agents edit files. Requiring exactly one match means a stale or vague
// passage fails loudly instead of changing the wrong place.

export type Replaced = { ok: true; text: string } | { ok: false; matches: number };

export function replaceOnce(text: string, oldText: string, newText: string): Replaced {
  const first = oldText ? text.indexOf(oldText) : -1;
  if (first === -1) return { ok: false, matches: 0 };
  let matches = 1;
  for (let at = text.indexOf(oldText, first + 1); at !== -1; at = text.indexOf(oldText, at + 1)) matches++;
  if (matches > 1) return { ok: false, matches };
  return { ok: true, text: text.slice(0, first) + newText + text.slice(first + oldText.length) };
}
