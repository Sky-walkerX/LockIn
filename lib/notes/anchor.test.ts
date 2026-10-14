import { describe, expect, it } from "vitest";
import { anchorForAgent, cleanFiles, diffCommand, normalizeRepo, repoMatches } from "./anchor";

describe("normalizeRepo", () => {
  it("writes every form of a remote the same way", () => {
    for (const remote of [
      "git@github.com:Sky-walkerX/LockIn.git",
      "https://github.com/Sky-walkerX/LockIn",
      "https://github.com/Sky-walkerX/LockIn.git/",
      "ssh://git@github.com/Sky-walkerX/LockIn.git",
      "Sky-walkerX/LockIn",
    ]) {
      expect(normalizeRepo(remote)).toBe("sky-walkerx/lockin");
    }
  });

  it("keeps only the folder's name from a path", () => {
    expect(normalizeRepo("/Users/me/Coding/Dev/LockIn")).toBe("lockin");
    expect(normalizeRepo("~/src/lockin/")).toBe("lockin");
  });

  it("is null for nothing", () => {
    expect(normalizeRepo("")).toBeNull();
    expect(normalizeRepo("   ")).toBeNull();
    expect(normalizeRepo(undefined)).toBeNull();
  });
});

describe("repoMatches", () => {
  it("matches a folder name to a full repo, but not two different owners", () => {
    expect(repoMatches("lockin", "sky-walkerx/lockin")).toBe(true);
    expect(repoMatches("sky-walkerx/lockin", "sky-walkerx/lockin")).toBe(true);
    expect(repoMatches("someone/lockin", "sky-walkerx/lockin")).toBe(false);
    expect(repoMatches("lockin", null)).toBe(false);
  });
});

describe("cleanFiles", () => {
  it("drops ./, blanks and repeats", () => {
    expect(cleanFiles(["./lib/a.ts", "lib/a.ts", " ", "lib/b.ts"])).toEqual(["lib/a.ts", "lib/b.ts"]);
  });
});

describe("anchorForAgent", () => {
  const anchor = {
    anchorRepo: "sky-walkerx/lockin",
    anchorCommit: "abc1234def5678",
    anchorFiles: ["lib/auth.ts", "app/my file.ts"],
    checkedAt: new Date("2026-10-01T10:00:00Z"),
    checkedBy: "codex",
  };

  it("says where the note points and how to check it", () => {
    const text = anchorForAgent(anchor, (s) => s.toUpperCase())!;
    expect(text).toContain("Code: sky-walkerx/lockin @ abc1234: lib/auth.ts, app/my file.ts.");
    expect(text).toContain("Last checked 2026-10-01 by CODEX.");
    expect(text).toContain("`git diff --stat abc1234 -- lib/auth.ts 'app/my file.ts'`");
    expect(text).toContain("confirm_note");
  });

  it("is null without an anchor, and has no diff without a commit", () => {
    expect(anchorForAgent({ ...anchor, anchorRepo: null, anchorCommit: null }, String)).toBeNull();
    expect(diffCommand({ anchorCommit: null, anchorFiles: [] })).toBeNull();
    expect(anchorForAgent({ ...anchor, anchorCommit: null }, String)).not.toContain("git diff");
  });
});
