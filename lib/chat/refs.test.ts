import { describe, expect, it } from "vitest";
import { digestRefs, refHref, uniqueRefs } from "./refs";

describe("digestRefs", () => {
  it("lists every paged note and resource, by page", () => {
    const refs = digestRefs([
      {
        id: "s1",
        title: "Rust",
        milestones: [
          { id: "n2", page: 7, title: "Lifetimes", isCompleted: false },
          { id: "n0", title: "Unpaged", isCompleted: false },
        ],
        resources: [{ id: "r1", page: 3, type: "PDF", title: "Book", url: "https://x" }],
      },
      { id: "inbox", title: "Inbox", isInbox: true, milestones: [{ id: "n9", page: 9, title: "Loose", isCompleted: false }] },
    ]);
    expect(refs.map((r) => [r.page, r.kind, r.id, r.inbox, r.retrieved])).toEqual([
      [3, "resource", "r1", false, false],
      [7, "note", "n2", false, false],
      [9, "note", "n9", true, false],
    ]);
  });
});

describe("refHref", () => {
  it("opens notes in their subject, Inbox notes in the Inbox, resources in the reader", () => {
    expect(refHref({ kind: "note", id: "n", subjectId: "s", inbox: false })).toBe("/subjects/s?note=n");
    expect(refHref({ kind: "note", id: "n", subjectId: "s", inbox: true })).toBe("/inbox?note=n");
    expect(refHref({ kind: "resource", id: "r", subjectId: "s", inbox: false })).toBe("/subjects/s?tab=resources&read=r");
  });

  it("opens the page at the passage a retrieved ref quotes", () => {
    expect(refHref({ kind: "note", id: "n", subjectId: "s", inbox: false, quote: "One owner & more" })).toBe(
      "/subjects/s?note=n&q=One%20owner%20%26%20more",
    );
    expect(refHref({ kind: "resource", id: "r", subjectId: "s", inbox: false, quote: "TLB" })).toBe("/subjects/s?tab=resources&read=r&q=TLB");
  });
});

describe("uniqueRefs", () => {
  it("keeps the first ref for each page", () => {
    const a = { page: 1, kind: "note" as const, id: "a", subjectId: "s", subjectTitle: "S", title: "A", inbox: false };
    expect(uniqueRefs([a, { ...a, id: "b" }, { ...a, page: 2 }]).map((r) => r.id)).toEqual(["a", "a"]);
  });
});
