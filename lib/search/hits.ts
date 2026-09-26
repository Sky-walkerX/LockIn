import { makeSnippet } from "./text";

export type HitKind = "subject" | "milestone" | "task" | "subtask";

/** One row of the search query: the matched record plus its ancestors' titles. */
export type SearchRow = {
  kind: HitKind;
  id: string;
  title: string;
  notes: string;
  isCompleted: boolean;
  subjectId: string;
  subjectTitle: string;
  color: string | null;
  milestoneTitle: string | null;
  taskTitle: string | null;
  // Set only for a nested item: the subtask it sits under.
  parentTitle: string | null;
};

/** What the search palette renders. Notes stay server-side; only the snippet ships. */
export type SearchHit = {
  kind: HitKind;
  id: string;
  title: string;
  snippet: string | null;
  isCompleted: boolean;
  color: string | null;
  path: string[];
  href: string;
};

const MAX_HITS = 20;

export function toHit(row: SearchRow, terms: string[]): SearchHit {
  const isSubject = row.kind === "subject";
  return {
    kind: row.kind,
    id: row.id,
    title: row.title,
    snippet: makeSnippet(row.notes, terms),
    isCompleted: row.isCompleted,
    color: row.color,
    path: isSubject
      ? []
      : [row.subjectTitle, row.milestoneTitle, row.taskTitle, row.parentTitle].filter(
          (p): p is string => !!p,
        ),
    // The subject page reads `open` to expand the rows down to this one.
    href: isSubject ? `/subjects/${row.subjectId}` : `/subjects/${row.subjectId}?open=${row.kind}:${row.id}`,
  };
}

/**
 * Order hits for the palette: every term in the title, then some, then notes
 * only. Every hit already contains all terms somewhere, so where they landed
 * is the signal. Ties go to the shorter title, the closer match.
 */
export function rankHits(hits: SearchHit[], terms: string[]): SearchHit[] {
  const score = (h: SearchHit) => {
    const title = h.title.toLowerCase();
    const inTitle = terms.filter((t) => title.includes(t)).length;
    if (inTitle === 0) return 0;
    return inTitle === terms.length ? 2 : 1;
  };
  return hits
    .map((h) => ({ h, s: score(h) }))
    .sort((a, b) => b.s - a.s || a.h.title.length - b.h.title.length)
    .slice(0, MAX_HITS)
    .map(({ h }) => h);
}
