// Turns scored note chunks into palette results. A source (a milestone's notes,
// an extracted document, …) can have many chunks; the palette shows it once,
// at its best-scoring passage.

export type ChunkSource = "SUBJECT" | "MILESTONE" | "TASK" | "SUBTASK" | "RESOURCE" | "RESOURCE_DOC";

export type SemanticChunk = {
  subjectId: string;
  subjectTitle: string;
  color: string | null;
  source: ChunkSource;
  sourceId: string;
  breadcrumb: string;
  content: string;
};

export type SemanticHit = {
  kind: "subject" | "milestone" | "task" | "subtask" | "resource" | "document";
  id: string;
  title: string;
  path: string[];
  snippet: string;
  score: number;
  color: string | null;
  href: string;
};

const KIND: Record<ChunkSource, SemanticHit["kind"]> = {
  SUBJECT: "subject",
  MILESTONE: "milestone",
  TASK: "task",
  SUBTASK: "subtask",
  RESOURCE: "resource",
  RESOURCE_DOC: "document",
};

// Markdown markers out, whitespace collapsed: the snippet is read, not rendered.
const plain = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const SNIPPET_CHARS = 180;
// Enough of the passage for the reader to find its section (lib/reader/sections.ts).
const PASSAGE_CHARS = 120;

function href(c: SemanticChunk, prose: string): string {
  const base = `/subjects/${c.subjectId}`;
  switch (c.source) {
    case "MILESTONE":
    case "TASK":
    case "SUBTASK":
      return `${base}?open=${KIND[c.source]}:${c.sourceId}`;
    case "RESOURCE_DOC":
      return `${base}?read=${c.sourceId}&q=${encodeURIComponent(prose.slice(0, PASSAGE_CHARS))}`;
    default:
      return base;
  }
}

export function toSemanticHits<T extends SemanticChunk>(
  scored: { item: T; score: number }[],
  { limit = 8, floor = 0.3 }: { limit?: number; floor?: number } = {},
): SemanticHit[] {
  const best = new Map<string, { item: T; score: number }>();
  for (const s of scored) {
    if (s.score < floor) continue;
    const key = `${s.item.source}:${s.item.sourceId}`;
    const prev = best.get(key);
    if (!prev || s.score > prev.score) best.set(key, s);
  }

  return [...best.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item: c, score }) => {
      const crumbs = c.breadcrumb.split(" > ").filter(Boolean);
      const prose = plain(c.content);
      return {
        kind: KIND[c.source],
        id: c.sourceId,
        title: crumbs[crumbs.length - 1] ?? c.subjectTitle,
        path: crumbs.slice(0, -1),
        snippet: prose.length > SNIPPET_CHARS ? `${prose.slice(0, SNIPPET_CHARS)}…` : prose,
        score,
        color: c.color,
        href: href(c, prose),
      };
    });
}
