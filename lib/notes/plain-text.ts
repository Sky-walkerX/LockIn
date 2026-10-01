/** Markdown markers out, whitespace collapsed: text to be read, not rendered. */
export function plainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const QUOTE_CHARS = 100;

/** The opening words of a passage, enough to find it again on the page,
 *  cut at a word boundary. */
export function passageQuote(md: string): string {
  const text = plainText(md);
  if (text.length <= QUOTE_CHARS) return text;
  const cut = text.slice(0, QUOTE_CHARS);
  return cut.slice(0, cut.lastIndexOf(" ") > 40 ? cut.lastIndexOf(" ") : QUOTE_CHARS);
}

/**
 * Where a quote sits in a page's text, as [start, end) in `text`, matching
 * case- and whitespace-insensitively. The page shows rendered markdown, so the
 * whole quote may not survive (a link's URL, a formula); failing that, the
 * longest run of its opening words that does is found instead.
 */
export function findQuote(text: string, quote: string): [number, number] | null {
  const words = quote.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  // Lowercase, and each whitespace run as one space, keeping a map back.
  let norm = "";
  const at: number[] = [];
  let space = false;
  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i])) {
      space = norm.length > 0;
      continue;
    }
    if (space) {
      norm += " ";
      at.push(i);
      space = false;
    }
    norm += text[i].toLowerCase();
    at.push(i);
  }
  for (let n = words.length; n >= Math.min(3, words.length); n--) {
    const needle = words.slice(0, n).join(" ");
    const start = norm.indexOf(needle);
    if (start >= 0) return [at[start], at[start + needle.length - 1] + 1];
  }
  return null;
}
