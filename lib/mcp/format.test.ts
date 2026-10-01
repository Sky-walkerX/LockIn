import { describe, expect, it } from "vitest";
import { formatNote, formatSearch, formatSubjects } from "./format";

describe("formatSubjects", () => {
  it("lists subjects with counts and ids, the Inbox by name", () => {
    const text = formatSubjects([
      { id: "s1", title: "Rust", isInbox: false, noteCount: 1 },
      { id: "i1", title: "Inbox", isInbox: true, noteCount: 3 },
    ]);
    expect(text).toContain("- Rust: 1 note (id s1)");
    expect(text).toContain("- Inbox: 3 unfiled notes (id i1)");
  });
  it("says what to do in an empty notebook", () => {
    expect(formatSubjects([])).toMatch(/Inbox/);
  });
});

describe("formatSearch", () => {
  it("numbers hits, calls milestones notes, and links when an origin is known", () => {
    const text = formatSearch(
      "borrow",
      [{ kind: "milestone", id: "m1", title: "Ownership", path: ["Rust"], snippet: "one  &mut\nreference", href: "/subjects/s1?note=m1" }],
      "https://nb.example",
      "keyword",
    );
    expect(text).toContain("1. Ownership (note, in Rust) id m1");
    expect(text).toContain("   one &mut reference");
    expect(text).toContain("   https://nb.example/subjects/s1?note=m1");
  });
  it("reports no matches plainly", () => {
    expect(formatSearch("zzz", [], null, "meaning")).toBe('Nothing in the notebook matches "zzz".');
  });
});

describe("formatNote", () => {
  const base = {
    id: "m1",
    title: "Advisory locks",
    notes: "Use xact locks.",
    updatedAt: "2026-10-02T10:00:00Z",
    subject: { title: "Distributed Systems", isInbox: false },
    tasks: [{ title: "Try it", isCompleted: true }],
  };
  it("marks an agent's unwitnessed note and lists its tasks", () => {
    const text = formatNote({ ...base, source: "claude-code", witnessedAt: null }, null);
    expect(text).toContain("# Advisory locks");
    expect(text).toContain("Recorded by Claude Code · Not yet witnessed by the user");
    expect(text).toContain("- [x] Try it");
  });
  it("calls the user's own note theirs", () => {
    expect(formatNote({ ...base, source: "web", witnessedAt: null }, "https://x/n")).toContain("Written by the user");
  });
});
