import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveRef } from "./store";

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

const live = (sourceId: string, contentHash: string, chunkCount = 4): LiveRef => ({
  source: "MILESTONE",
  sourceId,
  subjectId: "subject-1",
  contentHash,
  chunkCount,
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

  it("drops a batch that numbers a passage the text doesn't have", () => {
    // Two passages were counted for this text; a third can't be written, nor
    // can anything for a source the server hasn't chunked.
    expect(acceptedGroups([chunk("a", 0, "h1"), chunk("a", 2, "h1")], [live("a", "h1", 2)])).toEqual([]);
    expect(acceptedGroups([chunk("a", 0, "h1")], [live("a", "h1", 0)])).toEqual([]);
    expect(acceptedGroups([chunk("a", 1, "h1")], [live("a", "h1", 2)]).map((g) => g.chunks.length)).toEqual([1]);
  });

  it("drops a source that no longer exists", () => {
    expect(acceptedGroups([chunk("gone", 0, "h")], [])).toEqual([]);
  });
});

describe("storeChunks", () => {
  it("clears a source's earlier passages and the ones being rewritten, and nothing else", async () => {
    const written = await storeChunks("user-1", [chunk("a", 0, "h1"), chunk("a", 1, "h1")], [live("a", "h1")]);

    expect(written).toBe(2);
    expect(calls.map((c) => c.op)).toEqual(["deleteMany", "createMany"]);
    // Passages 2 and up of the same text, written by an earlier batch, stay.
    expect(calls[0].args).toEqual({
      where: {
        userId: "user-1",
        source: "MILESTONE",
        sourceId: "a",
        OR: [{ contentHash: { not: "h1" } }, { embeddingModel: { not: "snowflake-arctic-embed-s" } }, { ordinal: { in: [0, 1] } }],
      },
    });
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
