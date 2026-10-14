import { describe, expect, it } from "vitest";
import { CARD, PAGE_TEXT, clampCard, clipPages, formatHandoff, type Baton } from "./card";

describe("clampCard", () => {
  it("clips every field instead of refusing, and keeps the card short", () => {
    const long = "word ".repeat(400);
    const card = clampCard({ goal: long, state: long, tried: [long, " ", long, long, long, long, long], next: long, nextAt: long, pages: [4, 4, 12, -1, 2.5, 7, 8, 9, 10] });
    expect(card.goal.length).toBe(CARD.goal);
    expect(card.goal.endsWith("…")).toBe(true);
    expect(card.state.length).toBeLessThanOrEqual(CARD.state);
    expect(card.tried).toHaveLength(CARD.triedCount);
    expect(card.pages).toEqual([4, 12, 7, 8, 9]);
    const total = card.goal.length + card.state.length + card.tried.join("").length + card.next.length + (card.nextAt?.length ?? 0);
    expect(total).toBeLessThanOrEqual(1300);
  });

  it("keeps short fields as they are, with no start point when none is given", () => {
    expect(clampCard({ goal: "Move auth to OAuth", state: "Half done", next: "Wire the callback" })).toEqual({
      goal: "Move auth to OAuth",
      state: "Half done",
      tried: [],
      next: "Wire the callback",
      nextAt: null,
      pages: [],
    });
  });
});

describe("clipPages", () => {
  it("cuts each page and stops when the total runs out", () => {
    const page = (n: number) => ({ id: `m${n}`, page: n, title: `Page ${n}`, notes: "x".repeat(PAGE_TEXT.each + 500) });
    const out = clipPages([page(1), page(2), page(3), page(4)]);
    expect(out[0]).toContain("## p. 1: Page 1 (note m1)");
    expect(out[0]).toContain("(get_note m1 for the rest)");
    expect(out.length).toBe(Math.ceil(PAGE_TEXT.total / PAGE_TEXT.each));
  });
});

describe("formatHandoff", () => {
  const baton: Baton = {
    id: "h1",
    source: "claude-code",
    goal: "Move auth to OAuth",
    state: "Token exchange works; refresh doesn't yet.",
    tried: ["Reusing the old refresh table: rows lack the grant id"],
    next: "Store refresh tokens on OAuthGrant",
    nextAt: "lib/oauth/server.ts:190",
    pages: [4, 12],
    repo: "sky-walkerx/lockin",
    branch: "main",
    commit: "abc1234def",
    createdAt: "2026-10-14T16:40:00Z",
    subject: { title: "LockIn", isInbox: false },
    task: { id: "t1", title: "OAuth refresh", isCompleted: false },
    note: null,
  };

  it("reads as a short card with the next step last", () => {
    const text = formatHandoff(baton, [], "https://n/x");
    expect(text).toContain("# Baton from Claude Code, left 2026-10-14 16:40 UTC");
    expect(text).toContain("Repo: sky-walkerx/lockin on main @ abc1234");
    expect(text).toContain('Task: "OAuth refresh" (task t1)');
    expect(text).toContain("Tried and ruled out:\n- Reusing the old refresh table");
    expect(text).toContain("Next: Store refresh tokens on OAuthGrant (start at lib/oauth/server.ts:190)");
    expect(text).toContain("Read first: p. 4, p. 12");
  });

  it("brings the pinned pages' text when they're loaded", () => {
    const text = formatHandoff(baton, [{ id: "m4", page: 4, title: "OAuth grants", notes: "Grants carry the window." }]);
    expect(text).toContain("Read first:\n\n## p. 4: OAuth grants (note m4)\nGrants carry the window.");
  });
});
