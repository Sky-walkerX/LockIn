import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveSource } from "./sources";

// storeChunks only builds Prisma operations and runs them in one transaction;
// a recording stand-in is enough to see what it would write.
const calls: { op: string; args: unknown }[] = [];
vi.mock("@/lib/prisma", () => ({
  default: {
    noteChunk: {
      deleteMany: (args: unknown) => calls.push({ op: "deleteMany", args }),
      createMany: (args: unknown) => calls.push({ op: "createMany", args }),
    },
    $transaction: async (ops: unknown[]) => ops,
  },
}));

const { acceptedGroups, storeChunks } = await import("./store");

const live = (sourceId: string, contentHash: string): LiveSource => ({
  source: "MILESTONE",
  sourceId,
  subjectId: "subject-1",
  subjectTitle: "Rust",
  milestoneTitle: "Ownership",
  text: "…",
  contentHash,
  chunks: [],
});

const chunk = (sourceId: string, ordinal: number, contentHash: string) => ({
  source: "MILESTONE" as const,
  sourceId,
  ordinal,
  breadcrumb: "Rust › Ownership",
  content: `passage ${ordinal}`,
  contentHash,
  embedding: [0.1, 0.2],
});

beforeEach(() => {
  calls.length = 0;
});

describe("acceptedGroups", () => {
  it("groups a source's chunks together", () => {
    const groups = acceptedGroups([chunk("a", 0, "h1"), chunk("b", 0, "h2"), chunk("a", 1, "h1")], [live("a", "h1"), live("b", "h2")]);
    expect(groups.map((g) => [g.live.sourceId, g.chunks.map((c) => c.ordinal)])).toEqual([
      ["a", [0, 1]],
      ["b", [0]],
    ]);
  });

  it("drops a source that was edited while it was being embedded", () => {
    const groups = acceptedGroups([chunk("a", 0, "old"), chunk("b", 0, "h2")], [live("a", "new"), live("b", "h2")]);
    expect(groups.map((g) => g.live.sourceId)).toEqual(["b"]);
  });

  it("drops a source that no longer exists", () => {
    expect(acceptedGroups([chunk("gone", 0, "h")], [])).toEqual([]);
  });
});

describe("storeChunks", () => {
  it("replaces a source's old chunks rather than adding to them", async () => {
    const written = await storeChunks("user-1", [chunk("a", 0, "h1"), chunk("a", 1, "h1")], [live("a", "h1")]);

    expect(written).toBe(2);
    expect(calls.map((c) => c.op)).toEqual(["deleteMany", "createMany"]);
    expect(calls[0].args).toEqual({ where: { userId: "user-1", source: "MILESTONE", sourceId: "a" } });
    const rows = (calls[1].args as { data: { userId: string; subjectId: string; ordinal: number }[] }).data;
    expect(rows.map((r) => [r.userId, r.subjectId, r.ordinal])).toEqual([
      ["user-1", "subject-1", 0],
      ["user-1", "subject-1", 1],
    ]);
  });

  it("writes nothing when every source changed", async () => {
    expect(await storeChunks("user-1", [chunk("a", 0, "old")], [live("a", "new")])).toBe(0);
    expect(calls).toEqual([]);
  });
});
