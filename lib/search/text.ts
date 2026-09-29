export type Segment = { text: string; match: boolean };

/**
 * A one-line excerpt of `notes` around the earliest matching term, or null when
 * no term is in the notes (the hit matched on its title alone). Code fence lines
 * are markup and are dropped; whitespace is then collapsed, so a code block
 * reads as a single line in the results.
 */
export function makeSnippet(notes: string, terms: string[], radius = 60): string | null {
  const flat = notes
    .replace(/^[ \t]*(```|~~~).*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = flat.toLowerCase();

  let at = -1;
  let len = 0;
  for (const term of terms) {
    const i = term ? lower.indexOf(term.toLowerCase()) : -1;
    if (i !== -1 && (at === -1 || i < at)) {
      at = i;
      len = term.length;
    }
  }
  if (at === -1) return null;

  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + len + radius);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

/**
 * Split `text` into runs that do and don't match any term, ignoring case, for
 * highlighting. Matches are marked per character first, so overlapping terms
 * ("segment", "mented") come out as one run.
 */
export function splitMatches(text: string, terms: string[]): Segment[] {
  const lower = text.toLowerCase();
  const marked = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    for (let i = lower.indexOf(t); i !== -1; i = lower.indexOf(t, i + 1)) {
      marked.fill(true, i, i + t.length);
    }
  }

  const segments: Segment[] = [];
  for (let i = 0; i < text.length; ) {
    let j = i;
    while (j < text.length && marked[j] === marked[i]) j++;
    segments.push({ text: text.slice(i, j), match: marked[i] });
    i = j;
  }
  return segments;
}
