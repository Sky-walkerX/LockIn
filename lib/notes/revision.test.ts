import { describe, expect, it } from "vitest";
import { appendNote, continueNote } from "./append";
import { bodyRev, mergeAppended } from "./revision";

describe("bodyRev", () => {
  it("is the same for the same text", () => {
    expect(bodyRev("## Ownership\n\nOne owner.")).toBe(bodyRev("## Ownership\n\nOne owner."));
  });

  it("changes when the text does, even by a character", () => {
    expect(bodyRev("One owner.")).not.toBe(bodyRev("One owner!"));
    expect(bodyRev("ab")).not.toBe(bodyRev("ba"));
    expect(bodyRev("")).not.toBe(bodyRev(" "));
  });
});

describe("mergeAppended", () => {
  const base = "## Ownership\n\nEvery value has one owner.\n";
  const mine = "## Ownership\n\nEvery value has exactly one owner. It's dropped with its scope.\n";

  it("puts an agent's labelled addition under the user's edit", () => {
    const current = appendNote(base, "Borrowing reads without taking.", "From Codex", "2026-10-13");
    expect(mergeAppended(base, current, mine)).toBe(
      "## Ownership\n\nEvery value has exactly one owner. It's dropped with its scope.\n\n---\n*From Codex · 2026-10-13*\n\nBorrowing reads without taking.",
    );
  });

  it("keeps a plain continuation too", () => {
    const current = continueNote(base, "More from the agent that recorded it.");
    expect(mergeAppended(base, current, mine)).toBe(`${mine.trimEnd()}\n\nMore from the agent that recorded it.`);
  });

  it("keeps two additions made one after the other", () => {
    const once = appendNote(base, "First.", "From Codex", "2026-10-13");
    const twice = appendNote(once, "Second.", "From Cursor", "2026-10-13");
    const merged = mergeAppended(base, twice, mine)!;
    expect(merged.startsWith(mine.trimEnd())).toBe(true);
    expect(merged).toContain("First.");
    expect(merged).toContain("Second.");
  });

  it("gives the user's text back when nothing was really added", () => {
    expect(mergeAppended(base, `${base}\n\n`, mine)).toBe(mine);
  });

  it("takes what was added to a note that was empty when editing began", () => {
    expect(mergeAppended("", "Saved by an agent.", "My own start.")).toBe("My own start.\n\nSaved by an agent.");
    expect(mergeAppended("", "Saved by an agent.", "  ")).toBe("Saved by an agent.");
  });

  it("refuses when the note was changed rather than added to", () => {
    expect(mergeAppended(base, "## Ownership\n\nRewritten elsewhere.", mine)).toBeNull();
    expect(mergeAppended(base, "", mine)).toBeNull();
  });
});
