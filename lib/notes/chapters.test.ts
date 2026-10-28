import { describe, expect, it } from "vitest";
import { groupByChapter, readingOrder } from "./chapters";

const note = (id: string, chapterId: string | null = null) => ({ id, chapterId });
const ids = (ns: { id: string }[]) => ns.map((n) => n.id);

describe("readingOrder", () => {
  const chapters = [{ id: "setup" }, { id: "meetings" }];

  it("reads loose notes first, then each chapter in its order", () => {
    const notes = [note("a", "meetings"), note("b"), note("c", "setup"), note("d"), note("e", "setup")];
    expect(ids(readingOrder(notes, chapters))).toEqual(["b", "d", "c", "e", "a"]);
  });

  it("keeps the given order inside a chapter", () => {
    const notes = [note("z", "setup"), note("y", "setup"), note("x", "setup")];
    expect(ids(readingOrder(notes, chapters))).toEqual(["z", "y", "x"]);
  });

  it("reads a note whose chapter isn't there as loose", () => {
    const notes = [note("a", "gone"), note("b", "setup")];
    expect(ids(readingOrder(notes, chapters))).toEqual(["a", "b"]);
  });

  it("is the plain order with no chapters", () => {
    const notes = [note("a"), note("b")];
    expect(ids(readingOrder(notes, []))).toEqual(["a", "b"]);
  });
});

describe("groupByChapter", () => {
  it("gives every chapter a group, empty ones included", () => {
    const { loose, groups } = groupByChapter([note("a"), note("b", "setup")], [{ id: "setup" }, { id: "empty" }]);
    expect(ids(loose)).toEqual(["a"]);
    expect(groups.map((g) => [g.chapter.id, ids(g.notes)])).toEqual([
      ["setup", ["b"]],
      ["empty", []],
    ]);
  });
});
