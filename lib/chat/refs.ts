import type { ContextSubject } from "./types";

/**
 * A page an answer can cite: a note or a saved resource, with what it takes to
 * link to it. Ask labels every note and passage it sends the model with its
 * page ("p. 12"), and the reply's "[p. 12]" turns back into a link through
 * these.
 */
export type PageRef = {
  page: number;
  kind: "note" | "resource";
  id: string;
  subjectId: string;
  subjectTitle: string;
  title: string;
  inbox: boolean;
};

/** A ref as stored with a reply. `retrieved` marks the passages search picked,
 *  which are listed under the answer whether or not it cites them. */
export type MessageRef = PageRef & {
  retrieved: boolean;
  /** For a retrieved passage, its opening words: the link opens the page at it. */
  quote?: string;
};

export function refHref(ref: Pick<PageRef, "kind" | "id" | "subjectId" | "inbox"> & { quote?: string }): string {
  const q = ref.quote ? `&q=${encodeURIComponent(ref.quote)}` : "";
  if (ref.kind === "resource") return `/subjects/${ref.subjectId}?tab=resources&read=${ref.id}${q}`;
  return ref.inbox ? `/inbox?note=${ref.id}${q}` : `/subjects/${ref.subjectId}?note=${ref.id}${q}`;
}

/** Every page in the subjects sent whole (digest mode). */
export function digestRefs(subjects: ContextSubject[]): MessageRef[] {
  const refs: MessageRef[] = [];
  for (const s of subjects) {
    const base = { subjectId: s.id, subjectTitle: s.title, inbox: s.isInbox ?? false, retrieved: false };
    for (const m of s.milestones ?? []) {
      if (m.id && m.page != null) refs.push({ ...base, kind: "note", id: m.id, page: m.page, title: m.title });
    }
    for (const r of s.resources ?? []) {
      if (r.id && r.page != null) refs.push({ ...base, kind: "resource", id: r.id, page: r.page, title: r.title });
    }
  }
  return refs.sort((a, b) => a.page - b.page);
}

/** One entry per page, keeping the first seen. */
export function uniqueRefs<T extends PageRef>(refs: T[]): T[] {
  const seen = new Set<number>();
  return refs.filter((r) => (seen.has(r.page) ? false : (seen.add(r.page), true)));
}
