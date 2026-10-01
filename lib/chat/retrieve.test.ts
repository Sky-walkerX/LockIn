import { describe, expect, it } from "vitest";
import { assembleRetrievalPrompt } from "./retrieve";
import { RETRIEVAL_SYSTEM_PROMPT, SYSTEM_PROMPT } from "./prompt";
import type { ContextSubject } from "./types";
import type { ScorableChunk } from "@/lib/rag/sources";

const smallSubject: ContextSubject = {
  id: "s1",
  title: "Operating Systems",
  milestones: [{ title: "Memory management", isCompleted: false, tasks: [{ title: "Read Ch. 8", isCompleted: false, priority: "MEDIUM" }] }],
};

// Big enough that the full digest overflows a small ceiling.
function bigSubject(id: string, title: string): ContextSubject {
  return {
    id,
    title,
    description: "x".repeat(400),
    milestones: [
      {
        title: `${title} milestone`,
        isCompleted: false,
        notes: "y".repeat(2000),
        tasks: [
          { title: "Open task A", isCompleted: false, priority: "MEDIUM", description: "z".repeat(800) },
          { title: "Open task B", isCompleted: false, priority: "MEDIUM" },
        ],
      },
    ],
  };
}

function chunk(over: Partial<ScorableChunk> & { embedding: number[] }): ScorableChunk {
  return {
    subjectId: "s1",
    subjectTitle: "Operating Systems",
    subjectColor: null,
    source: "MILESTONE",
    sourceId: "m1",
    ordinal: 0,
    breadcrumb: "Operating Systems > Memory management",
    content: "Paging vs segmentation.",
    ...over,
  };
}

const baseInput = {
  digestSystemPrompt: SYSTEM_PROMPT,
  retrievalSystemPrompt: RETRIEVAL_SYSTEM_PROMPT,
  contextSubjectIds: [],
  history: [],
  question: "What should I revise next?",
  ragEnabled: true,
};

describe("assembleRetrievalPrompt", () => {
  it("uses digest mode untouched when the full digest already fits", () => {
    const { budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [smallSubject],
      chunks: [],
      ceiling: 8000,
      queryEmbedding: [1, 0],
    });
    expect(budget.mode).toBe("digest");
    expect(budget.degraded).toBeUndefined();
    expect(budget.sources).toEqual([]);
  });

  it("stays in digest mode (no degraded flag) when rag is disabled, even if the digest overflows", () => {
    const { budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [bigSubject("s1", "Operating Systems")],
      chunks: [],
      ceiling: 500,
      ragEnabled: false,
      queryEmbedding: [1, 0],
    });
    expect(budget.mode).toBe("digest");
    expect(budget.degraded).toBeUndefined();
  });

  it("falls back to digest mode, marked degraded, when retrieval is wanted but no query vector arrived", () => {
    const { budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [bigSubject("s1", "Operating Systems")],
      chunks: [],
      ceiling: 500,
      queryEmbedding: undefined,
    });
    expect(budget.mode).toBe("digest");
    expect(budget.degraded).toBe(true);
  });

  it("also degrades on an empty query vector", () => {
    const { budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [bigSubject("s1", "Operating Systems")],
      chunks: [],
      ceiling: 500,
      queryEmbedding: [],
    });
    expect(budget.degraded).toBe(true);
  });

  it("switches to retrieval mode and reports selected sources when the digest overflows and a query vector is present", () => {
    const chunks = [
      chunk({ sourceId: "m1", embedding: [1, 0] }),
      chunk({ sourceId: "m2", breadcrumb: "Operating Systems > Read Ch. 8", content: "Silberschatz notes.", embedding: [0, 1] }),
    ];
    const { messages, budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [bigSubject("s1", "Operating Systems")],
      chunks,
      ceiling: 500,
      queryEmbedding: [1, 0],
    });

    expect(budget.mode).toBe("retrieval");
    expect(budget.sources.length).toBeGreaterThan(0);
    expect(budget.sources[0].breadcrumb).toContain("Operating Systems");

    const system = messages.find((m) => m.role === "system")!.content;
    expect(system).toContain("## Notebook outline");
    expect(system).toContain("### Operating Systems");
  });

  it("scores chunks by dot product and excludes chunks with mismatched dimensions", () => {
    const chunks = [
      chunk({ sourceId: "m1", embedding: [1, 0] }), // matches query, scores 1
      chunk({ sourceId: "m2", embedding: [1, 0, 0] }), // dimension mismatch, excluded
    ];
    const { budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [bigSubject("s1", "Operating Systems")],
      chunks,
      ceiling: 500,
      queryEmbedding: [1, 0],
    });
    expect(budget.mode).toBe("retrieval");
    expect(budget.sources.length).toBe(1);
  });

  it("drops subjects from the tail (naming them) when the outline alone exceeds its budget share", () => {
    const many = Array.from({ length: 12 }, (_, i) => bigSubject(`s${i}`, `Subject Number ${i} With A Longer Title`));
    const { budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: many,
      chunks: [],
      ceiling: 500,
      queryEmbedding: [1, 0],
    });

    expect(budget.mode).toBe("retrieval");
    expect(budget.subjectCount).toBeLessThan(many.length);
    expect(budget.truncated.some((t) => t.startsWith('subject "Subject Number'))).toBe(true);
  });
});

describe("assembleRetrievalPrompt page refs", () => {
  const ref = (page: number, id: string) => ({
    page,
    kind: "note" as const,
    id,
    subjectId: "s1",
    subjectTitle: "Operating Systems",
    title: id,
    inbox: false,
  });

  it("offers every page of a digest, none marked retrieved", () => {
    const paged: ContextSubject = { ...smallSubject, milestones: [{ id: "m1", page: 4, title: "Memory", isCompleted: false }] };
    const { budget } = assembleRetrievalPrompt({ ...baseInput, subjects: [paged], chunks: [], ceiling: 8000 });
    expect(budget.refs.map((r) => [r.page, r.retrieved])).toEqual([[4, false]]);
  });

  it("labels retrieved passages with their page and marks them retrieved", () => {
    const { messages, budget } = assembleRetrievalPrompt({
      ...baseInput,
      subjects: [bigSubject("s1", "Operating Systems")],
      chunks: [chunk({ embedding: [1, 0], ref: ref(12, "m1") }), chunk({ embedding: [1, 0], sourceId: "m2", ref: null })],
      ceiling: 500,
      queryEmbedding: [1, 0],
    });
    expect(budget.mode).toBe("retrieval");
    expect(messages[0].content).toContain("### Operating Systems > Memory management [p. 12]");
    expect(budget.refs.map((r) => [r.page, r.retrieved])).toEqual([[12, true]]);
  });
});
