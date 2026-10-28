// A subject's notes as they read: the ones in no chapter first, then each
// chapter's in turn. The list, Zen, Go to and the export all go by this, so
// "the next note" means the same thing everywhere. Notes keep the order they
// arrive in (by `order`) within each group.

type NoteRef = { chapterId?: string | null };
type ChapterRef = { id: string };

export type ChapterGroup<N, C> = { chapter: C; notes: N[] };

export function groupByChapter<N extends NoteRef, C extends ChapterRef>(
  notes: N[],
  chapters: C[],
): { loose: N[]; groups: ChapterGroup<N, C>[] } {
  const known = new Set(chapters.map((c) => c.id));
  // A note pointing at a chapter that isn't here (deleted a moment ago, say)
  // reads as loose rather than disappearing.
  const loose = notes.filter((n) => !n.chapterId || !known.has(n.chapterId));
  const groups = chapters.map((chapter) => ({ chapter, notes: notes.filter((n) => n.chapterId === chapter.id) }));
  return { loose, groups };
}

export function readingOrder<N extends NoteRef, C extends ChapterRef>(notes: N[], chapters: C[]): N[] {
  const { loose, groups } = groupByChapter(notes, chapters);
  return [...loose, ...groups.flatMap((g) => g.notes)];
}
