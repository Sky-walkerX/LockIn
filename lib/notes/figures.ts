// Figures: a quote whose first line starts with `[!FIG]` is pinned to the page
// as a numbered figure, the Lab Book's taped printout. The rest of that first
// line is the caption:
//
//   > [!FIG] Compiler output, rustc 1.83
//   > ```rust
//   > let s2 = s1;
//   > ```
//
// A remark plugin over the parsed tree: the quote becomes a <figure> and the
// caption a <figcaption> after its content, "Fig. 18.1 · Compiler output…",
// numbered by the note's page and the figure's place in the note. Outside
// LockIn (GitHub, Obsidian) the same text still reads as a quote.

type Inline = { type: string; value?: string; children?: Inline[] };
type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

const MARKER = /^\[!fig\][ \t]*/i;

/** The figure's caption (inline nodes, possibly none) and the content left after it, or null when it isn't one. */
function takeCaption(quote: MdNode): Inline[] | null {
  const first = quote.children?.[0];
  const lead = first?.type === "paragraph" ? first.children?.[0] : undefined;
  if (!first || lead?.type !== "text" || !MARKER.test(lead.value ?? "")) return null;

  // The caption runs to the end of the marker's line; anything after it in the
  // same paragraph is the start of the figure's content.
  const nodes: Inline[] = [{ type: "text", value: lead.value!.replace(MARKER, "") }, ...first.children!.slice(1)];
  const caption: Inline[] = [];
  const rest: Inline[] = [];
  let ended = false;
  for (const node of nodes) {
    if (ended) rest.push(node);
    else if (node.type === "break") ended = true;
    else if (node.type === "text" && node.value!.includes("\n")) {
      const at = node.value!.indexOf("\n");
      caption.push({ type: "text", value: node.value!.slice(0, at) });
      rest.push({ type: "text", value: node.value!.slice(at + 1) });
      ended = true;
    } else caption.push(node);
  }

  const kept = rest.filter((n) => n.type !== "text" || n.value!.trim());
  if (kept.length > 0) {
    if (rest[0]?.type === "text") rest[0] = { type: "text", value: rest[0].value!.replace(/^\s+/, "") };
    first.children = rest as MdNode[];
  } else quote.children = quote.children!.slice(1);

  const start = caption[0];
  if (start?.type === "text") start.value = start.value!.replace(/^\s+/, "");
  const end = caption.at(-1);
  if (end?.type === "text") end.value = end.value!.replace(/\s+$/, "");
  return caption.filter((n) => n.type !== "text" || n.value);
}

/** Turn every `[!FIG]` quote in the tree into a numbered figure, in document order. */
export function markFigures(tree: MdNode, page?: number | null): void {
  let count = 0;
  const walk = (node: MdNode) => {
    for (const child of node.children ?? []) {
      if (child.type === "blockquote") {
        const caption = takeCaption(child);
        if (caption) {
          count += 1;
          const label = page != null ? `Fig. ${page}.${count}` : `Fig. ${count}`;
          child.data = { hName: "figure", hProperties: { className: ["lk-fig"] } };
          child.children = [
            ...(child.children ?? []),
            {
              type: "paragraph",
              data: { hName: "figcaption", hProperties: { className: ["lk-fig-cap"] } },
              children: [{ type: "text", value: caption.length > 0 ? `${label} · ` : label }, ...(caption as MdNode[])],
            },
          ];
        }
      }
      walk(child);
    }
  };
  walk(tree);
}

/** The remark plugin: `[remarkFigures, { page }]`. */
export function remarkFigures(options: { page?: number | null } = {}) {
  return (tree: MdNode) => markFigures(tree, options.page);
}
