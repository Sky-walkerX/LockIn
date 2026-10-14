import { describe, expect, it } from "vitest";
import { noteStatus, type Replacement } from "./status";

const plain = { staleReason: null, staleAt: null, staleBy: null, supersededBy: [] as Replacement[] };
const proposal = (witnessed: boolean, id = "new"): Replacement => ({
  id,
  page: 12,
  title: "Auth, after the move to OAuth",
  source: "codex",
  witnessedAt: witnessed ? new Date() : null,
});

describe("noteStatus", () => {
  it("is current with nothing against it", () => {
    expect(noteStatus(plain)).toEqual({ kind: "current" });
  });

  it("is only proposed for replacement until the user witnesses the new note", () => {
    expect(noteStatus({ ...plain, supersededBy: [proposal(false)] }).kind).toBe("proposed");
    expect(noteStatus({ ...plain, supersededBy: [proposal(false, "a"), proposal(true, "b")] })).toMatchObject({
      kind: "replaced",
      by: { id: "b" },
    });
  });

  it("puts a replacement before a stale flag", () => {
    const flagged = { ...plain, staleReason: "auth.ts changed", staleAt: new Date(), staleBy: "codex" };
    expect(noteStatus(flagged)).toMatchObject({ kind: "stale", reason: "auth.ts changed", by: "codex" });
    expect(noteStatus({ ...flagged, supersededBy: [proposal(false)] }).kind).toBe("proposed");
  });
});
