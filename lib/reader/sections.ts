// Extracted documents can run to 2 MB of markdown. The reader renders them a
// few sections at a time, so they're split here: at each heading, and — for
// text with few or no headings, which is most PDFs — at paragraph breaks once a
// section passes `maxChars`. Never inside fenced code.

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^#{1,6}\s/;

export function splitSections(markdown: string, maxChars = 12_000): string[] {
  const sections: string[] = [];
  let current: string[] = [];
  let size = 0;
  let lastBreak = -1; // index in `current` of the latest blank line outside code
  let fenced = false;

  const emit = (lines: string[]) => {
    const text = lines.join("\n").trim();
    if (text) sections.push(text);
  };

  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) fenced = !fenced;
    if (!fenced && HEADING.test(line)) {
      emit(current);
      current = [];
      size = 0;
      lastBreak = -1;
    }
    // Over the limit: cut at the last paragraph break, carry the rest over.
    if (size + line.length + 1 > maxChars && lastBreak > 0) {
      emit(current.slice(0, lastBreak));
      current = current.slice(lastBreak + 1);
      size = current.reduce((n, l) => n + l.length + 1, 0);
      lastBreak = -1;
    }
    if (!fenced && line.trim() === "" && current.length > 0) lastBreak = current.length;
    current.push(line);
    size += line.length + 1;
  }
  emit(current);
  return sections;
}

// Letters and digits only: extraction and chunking disagree about punctuation
// and line breaks, not about words.
const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Index of the section containing `passage` (or at least its first few words), or -1. */
export function findSection(sections: string[], passage: string): number {
  const full = normalize(passage);
  if (!full) return -1;
  const head = full.split(" ").slice(0, 6).join(" ");
  const flat = sections.map(normalize);
  const exact = flat.findIndex((s) => s.includes(full));
  return exact !== -1 ? exact : flat.findIndex((s) => s.includes(head));
}
