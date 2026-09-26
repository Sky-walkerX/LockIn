import { describe, expect, it } from "vitest";
import { parseOpen, revealPath, type RevealTree } from "./path";

const tree: RevealTree = {
  milestones: [
    {
      id: "m1",
      tasks: [{ id: "t1", subtasks: [{ id: "st1", children: [{ id: "c1" }] }] }],
    },
  ],
  tasks: [{ id: "t2", subtasks: [{ id: "st2", children: [] }] }],
};

describe("parseOpen", () => {
  it("reads a kind and id from the open param", () => {
    expect(parseOpen("subtask:st1")).toEqual({ kind: "subtask", id: "st1" });
    expect(parseOpen("milestone:m1")).toEqual({ kind: "milestone", id: "m1" });
  });

  it("rejects missing, unknown or empty values", () => {
    expect(parseOpen(null)).toBeNull();
    expect(parseOpen("subject:s1")).toBeNull();
    expect(parseOpen("subtask:")).toBeNull();
    expect(parseOpen("st1")).toBeNull();
  });
});

describe("revealPath", () => {
  it("lists every row to expand, outermost first, ending at the target", () => {
    expect(revealPath(tree, { kind: "subtask", id: "c1" })).toEqual(["m1", "t1", "st1", "c1"]);
  });

  it("skips the milestone for a task that has none", () => {
    expect(revealPath(tree, { kind: "subtask", id: "st2" })).toEqual(["t2", "st2"]);
    expect(revealPath(tree, { kind: "task", id: "t2" })).toEqual(["t2"]);
  });

  it("finds a milestone on its own", () => {
    expect(revealPath(tree, { kind: "milestone", id: "m1" })).toEqual(["m1"]);
  });

  it("returns null when the target is no longer in the subject", () => {
    expect(revealPath(tree, { kind: "subtask", id: "gone" })).toBeNull();
  });
});
