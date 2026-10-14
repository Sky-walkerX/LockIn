import { describe, expect, it } from "vitest";
import { anchorForAgent, cleanFiles, commitLabel, diffCommand, isEarlierCommit, normalizeRepo, parseCommitDate, repoMatches } from "./anchor";

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
    anchorCommitAt: null,
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

describe("commit dates", () => {
  const now = new Date("2026-10-14T12:00:00Z");

  it("reads what git prints, and refuses junk and the future", () => {
    expect(parseCommitDate("2026-10-03T19:30:00+05:30", now)?.toISOString()).toBe("2026-10-03T14:00:00.000Z");
    expect(parseCommitDate("not a date", now)).toBeNull();
    expect(parseCommitDate("2026-12-01T00:00:00Z", now)).toBeNull();
    expect(parseCommitDate(undefined, now)).toBeNull();
  });

  it("labels the commit with its date when it's known", () => {
    expect(commitLabel({ anchorCommit: "abc1234def", anchorCommitAt: "2026-10-03T14:00:00Z" })).toBe("@ abc1234, committed 2026-10-03");
    expect(commitLabel({ anchorCommit: "abc1234def", anchorCommitAt: null })).toBe("@ abc1234");
    expect(commitLabel({ anchorCommit: null, anchorCommitAt: null })).toBeNull();
  });

  it("orders two notes by their commits only when both dates are known", () => {
    const older = { anchorCommitAt: "2026-10-03T00:00:00Z" };
    const newer = { anchorCommitAt: "2026-10-17T00:00:00Z" };
    expect(isEarlierCommit(older, newer)).toBe(true);
    expect(isEarlierCommit(newer, older)).toBe(false);
    expect(isEarlierCommit({ anchorCommitAt: null }, newer)).toBe(false);
  });

  it("puts the date in what the reading agent sees", () => {
    const text = anchorForAgent(
      { anchorRepo: "a/b", anchorCommit: "abc1234", anchorCommitAt: new Date("2026-10-03T14:00:00Z"), anchorFiles: [], checkedAt: null, checkedBy: null },
      String,
    )!;
    expect(text).toContain("Code: a/b @ abc1234, committed 2026-10-03.");
  });
});
