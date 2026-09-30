import { describe, expect, it } from "vitest";
import { awaitingWitness, isOwnNote, sourceLabel } from "./source";
import { chunkSourcesOf } from "./move";

describe("sourceLabel", () => {
  it("names known agents", () => {
    expect(sourceLabel("claude-code")).toBe("Claude Code");
    expect(sourceLabel("Codex")).toBe("Codex");
  });
  it("title-cases agents it doesn't know", () => {
    expect(sourceLabel("my_agent-v2")).toBe("My Agent V2");
  });
  it("calls the app and pre-source notes 'you'", () => {
    expect(sourceLabel("web")).toBe("you");
    expect(sourceLabel(null)).toBe("you");
  });
});

describe("awaitingWitness", () => {
  it("is true only for an agent's unsigned note", () => {
    expect(awaitingWitness({ source: "codex", witnessedAt: null })).toBe(true);
    expect(awaitingWitness({ source: "codex", witnessedAt: "2026-10-02T10:00:00Z" })).toBe(false);
    expect(awaitingWitness({ source: "web", witnessedAt: null })).toBe(false);
    expect(awaitingWitness({ source: null })).toBe(false);
  });
  it("treats a missing source as the user's own", () => {
    expect(isOwnNote(undefined)).toBe(true);
  });
});

describe("chunkSourcesOf", () => {
  it("collects the note, its tasks and every nested subtask", () => {
    const refs = chunkSourcesOf({
      id: "m1",
      tasks: [
        { id: "t1", subtasks: [{ id: "s1", children: [{ id: "s1a" }] }, { id: "s2" }] },
        { id: "t2", subtasks: [] },
      ],
    });
    expect(refs).toEqual([
      { source: "MILESTONE", ids: ["m1"] },
      { source: "TASK", ids: ["t1", "t2"] },
      { source: "SUBTASK", ids: ["s1", "s1a", "s2"] },
    ]);
  });
  it("leaves out empty groups", () => {
    expect(chunkSourcesOf({ id: "m1", tasks: [] })).toEqual([{ source: "MILESTONE", ids: ["m1"] }]);
  });
});
