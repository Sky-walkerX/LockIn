/**
 * Finds the page citations in a reply, "[p. 12]" or "[p. 12, p. 31]", the form
 * the system prompt asks for, plus the variations models drift into ("[p.12]",
 * "[pp. 12, 31]", "[p. 12; p. 31]"). Code is left alone: a "[p. 3]" inside a
 * code block is code.
 */

const CITATION = /\[\s*pp?\.\s*\d+(?:\s*[,;]\s*(?:pp?\.\s*)?\d+)*\s*\]/g;

/** Text outside fenced and inline code, with a function applied to it. */
function outsideCode(text: string, fn: (prose: string) => string): string {
  // Fences first (whole lines), then inline code spans within what's left.
  return text
    .split(/(^```[\s\S]*?^```[^\n]*$|^```[\s\S]*$)/m)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .split(/(`+[^`]*`+)/)
            .map((piece, j) => (j % 2 === 1 ? piece : fn(piece)))
            .join(""),
    )
    .join("");
}

function pagesIn(citation: string): number[] {
  return [...citation.matchAll(/\d+/g)].map((m) => Number(m[0]));
}

/** Every page the reply cites, in order of first mention. */
export function citedPages(text: string): number[] {
  const pages: number[] = [];
  outsideCode(text, (prose) => {
    for (const m of prose.matchAll(CITATION)) for (const p of pagesIn(m[0])) if (!pages.includes(p)) pages.push(p);
    return prose;
  });
  return pages;
}

/** The fragment a cited page links to; `Markdown` draws these as chips. */
export const CITE_PREFIX = "#cite-";

/**
 * Rewrites citations as markdown links to `#cite-<page>`, one per page. A page
 * that isn't among `known` (the model made it up) is left as plain "p. 99",
 * unlinked, so it can't send anyone to the wrong note.
 */
export function linkCitations(text: string, known: Set<number>): string {
  return outsideCode(text, (prose) =>
    prose.replace(CITATION, (citation) =>
      pagesIn(citation)
        .map((p) => (known.has(p) ? `[p. ${p}](${CITE_PREFIX}${p})` : `p. ${p}`))
        .join(" "),
    ),
  );
}
