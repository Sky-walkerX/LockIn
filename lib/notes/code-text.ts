/** A hast node, reduced to the fields text extraction reads. */
export type HastNode = { type: string; value?: string; tagName?: string; children?: HastNode[] };

/**
 * The plain source of a rendered code block, for its copy button.
 *
 * rehype-highlight splits the code into `hljs-*` spans, so the source is every
 * text node underneath joined back together. mdast-to-hast appends one newline
 * to a block's value; only that one is dropped, so a snippet that really ends
 * in a blank line keeps it.
 */
export function codeText(node: HastNode | undefined): string {
  if (!node) return "";
  const collect = (n: HastNode): string =>
    n.type === "text" ? (n.value ?? "") : (n.children ?? []).map(collect).join("");
  const text = collect(node);
  return text.endsWith("\n") ? text.slice(0, -1) : text;
}
