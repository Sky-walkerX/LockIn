import { describe, expect, it } from "vitest";
import { rankHits, toHit, type SearchHit, type SearchRow } from "./hits";

const row = (partial: Partial<SearchRow> & Pick<SearchRow, "kind" | "id" | "title">): SearchRow => ({
  notes: "",
  isCompleted: false,
  subjectId: "s1",
  subjectTitle: "Competitive Programming",
  color: "#57a",
  milestoneTitle: null,
  taskTitle: null,
  parentTitle: null,
  ...partial,
});

const hit = (title: string, snippet: string | null = null): SearchHit =>
  toHit(row({ kind: "task", id: title, title, notes: snippet ?? "" }), ["sieve"]);

describe("toHit", () => {
  it("builds the breadcrumb from the ancestors the row has", () => {
    const nested = toHit(
      row({
        kind: "subtask",
        id: "st1",
        title: "Segmented",
        milestoneTitle: "ICPC",
        taskTitle: "Number Theory",
        parentTitle: "Sieve",
      }),
      [],
    );
    expect(nested.path).toEqual(["Competitive Programming", "ICPC", "Number Theory", "Sieve"]);

    const loose = toHit(row({ kind: "task", id: "t1", title: "Graphs" }), []);
    expect(loose.path).toEqual(["Competitive Programming"]);
  });

  it("links a subject to its page and anything else to its row on that page", () => {
    expect(toHit(row({ kind: "subject", id: "s1", title: "CP" }), []).href).toBe("/subjects/s1");
    expect(toHit(row({ kind: "subtask", id: "st1", title: "Basic" }), []).href).toBe(
      "/subjects/s1?open=subtask:st1",
    );
  });

  it("takes the snippet from the notes around the matched term", () => {
    const h = toHit(row({ kind: "subtask", id: "st1", title: "Basic", notes: "// Basic Sieve TC: O(nlogn)" }), [
      "sieve",
    ]);
    expect(h.snippet).toBe("// Basic Sieve TC: O(nlogn)");
  });
});

describe("rankHits", () => {
  it("puts title matches above notes-only matches", () => {
    const ranked = rankHits([hit("Number Theory", "uses a sieve"), hit("Sieve")], ["sieve"]);
    expect(ranked.map((h) => h.title)).toEqual(["Sieve", "Number Theory"]);
  });

  it("prefers a title matching every term over one matching some", () => {
    const ranked = rankHits([hit("Sieve"), hit("Segmented sieve")], ["segmented", "sieve"]);
    expect(ranked.map((h) => h.title)).toEqual(["Segmented sieve", "Sieve"]);
  });

  it("breaks ties with the shorter title", () => {
    const ranked = rankHits([hit("Sieve of Eratosthenes"), hit("Sieve")], ["sieve"]);
    expect(ranked.map((h) => h.title)).toEqual(["Sieve", "Sieve of Eratosthenes"]);
  });

  it("returns at most twenty hits", () => {
    const many = Array.from({ length: 25 }, (_, i) => hit(`Sieve ${i}`));
    expect(rankHits(many, ["sieve"])).toHaveLength(20);
  });
});
