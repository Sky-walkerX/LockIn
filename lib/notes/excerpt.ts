/**
 * The opening of a markdown note as plain text, for list rows that show a line
 * of what the note says. Code blocks are dropped rather than flattened: a row
 * that reads `let s1 = String::from(…)` says less about the note than the
 * prose around it. Returns "" for a note with nothing but code or markup.
 */
export function excerpt(markdown: string, max = 160): string {
  const text = markdown
    .replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[ \t]*$/gm, " ") // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links keep their text
    .replace(/`([^`]*)`/g, "$1") // inline code
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, "") // heading marks
    .replace(/^[ \t]*>[ \t]?/gm, "") // quotes
    .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+(?:\[[ xX]\][ \t]+)?/gm, "") // list and task marks
    .replace(/(\*\*|\*|~~)(?=\S)([\s\S]*?\S)\1/g, "$2") // emphasis
    .replace(/(?<![A-Za-z0-9])(__|_)(?=\S)([\s\S]*?\S)\1(?![A-Za-z0-9])/g, "$2") // _emphasis_, not snake_case
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "")}…`;
}
