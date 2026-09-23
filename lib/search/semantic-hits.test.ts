import { describe, expect, it } from "vitest";
import { toSemanticHits, type SemanticChunk } from "./semantic-hits";

const chunk = (over: Partial<SemanticChunk> & Pick<SemanticChunk, "source" | "sourceId">): SemanticChunk => ({
  subjectId: "s1",
  subjectTitle: "Operating Systems",
  breadcrumb: "Operating Systems > Memory > Paging",
  content: "The TLB caches recent page table entries so most lookups skip the walk.",
  color: "#57a",
  ...over,
});

describe("toSemanticHits", () => {
  it("keeps the best chunk per source, drops weak matches, and caps the list", () => {
    const hits = toSemanticHits(
      [
        { item: chunk({ source: "MILESTONE", sourceId: "m1" }), score: 0.8 },
        { item: chunk({ source: "MILESTONE", sourceId: "m1", content: "second chunk" }), score: 0.7 },
        { item: chunk({ source: "TASK", sourceId: "t1" }), score: 0.5 },
        { item: chunk({ source: "TASK", sourceId: "t2" }), score: 0.2 },
      ],
      { limit: 8, floor: 0.3 },
    );
    expect(hits.map((h) => h.id)).toEqual(["m1", "t1"]);
    expect(hits[0].snippet).toContain("The TLB caches");
  });

  it("titles a hit by the last breadcrumb step and paths it by the rest", () => {
    const [h] = toSemanticHits([{ item: chunk({ source: "MILESTONE", sourceId: "m1" }), score: 0.9 }]);
    expect(h.title).toBe("Paging");
    expect(h.path).toEqual(["Operating Systems", "Memory"]);
  });

  it("links plan items to their row, and documents into the reader at the passage", () => {
    const [m, t, st, subj, doc, note] = toSemanticHits(
      [
        { item: chunk({ source: "MILESTONE", sourceId: "m1" }), score: 0.9 },
        { item: chunk({ source: "TASK", sourceId: "t1" }), score: 0.85 },
        { item: chunk({ source: "SUBTASK", sourceId: "st1" }), score: 0.8 },
        { item: chunk({ source: "SUBJECT", sourceId: "s1" }), score: 0.75 },
        { item: chunk({ source: "RESOURCE_DOC", sourceId: "r1", content: "## Heading\n\nThe TLB, caches: entries." }), score: 0.7 },
        { item: chunk({ source: "RESOURCE", sourceId: "r2" }), score: 0.65 },
      ],
      { limit: 8, floor: 0.3 },
    );
    expect(m.href).toBe("/subjects/s1?open=milestone:m1");
    expect(t.href).toBe("/subjects/s1?open=task:t1");
    expect(st.href).toBe("/subjects/s1?open=subtask:st1");
    expect(subj.href).toBe("/subjects/s1");
    // The passage keeps a leading heading's words: they open the same section in
    // the document, and the reader matches on words, not markup.
    expect(doc.href).toBe(`/subjects/s1?read=r1&q=${encodeURIComponent("Heading The TLB, caches: entries.")}`);
    expect(note.href).toBe("/subjects/s1");
    expect(doc.kind).toBe("document");
  });

  it("builds the snippet from prose, not markdown syntax", () => {
    const [h] = toSemanticHits([
      { item: chunk({ source: "TASK", sourceId: "t1", content: "# Title\n\n- **Bold** point and `code`" }), score: 0.9 },
    ]);
    expect(h.snippet).toBe("Title Bold point and code");
  });
});
