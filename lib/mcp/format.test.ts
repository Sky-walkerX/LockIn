import { describe, expect, it } from "vitest";
import { formatNote, formatPlan, formatPlanItem, formatRelated, formatSearch, formatSubjects, formatTasks, type PlanTask } from "./format";

describe("formatSubjects", () => {
  it("lists subjects with counts and ids, the Inbox by name", () => {
    const text = formatSubjects([
      { id: "s1", title: "Rust", isInbox: false, noteCount: 1 },
      { id: "i1", title: "Inbox", isInbox: true, noteCount: 3 },
    ]);
    expect(text).toContain("- Rust: 1 note (id s1)");
    expect(text).toContain("- Inbox: 3 unfiled notes (id i1)");
  });
  it("says what to do in an empty notebook", () => {
    expect(formatSubjects([])).toMatch(/Inbox/);
  });
});

describe("formatSearch", () => {
  it("numbers hits, calls milestones notes, and links when an origin is known", () => {
    const text = formatSearch(
      "borrow",
      [{ kind: "milestone", id: "m1", title: "Ownership", path: ["Rust"], snippet: "one  &mut\nreference", href: "/subjects/s1?note=m1" }],
      "https://nb.example",
      "keyword",
    );
    expect(text).toContain("1. Ownership (note, in Rust) id m1");
    expect(text).toContain("   one &mut reference");
    expect(text).toContain("   https://nb.example/subjects/s1?note=m1");
  });
  it("gives a note's or resource's page when it has one", () => {
    const text = formatSearch(
      "borrow",
      [
        { kind: "milestone", id: "m1", title: "Ownership", path: ["Rust"], snippet: null, href: "/x", page: 12 },
        { kind: "task", id: "t1", title: "Read ch. 4", path: ["Rust"], snippet: null, href: "/y" },
      ],
      null,
      "keyword",
    );
    expect(text).toContain("1. Ownership (note, p. 12, in Rust) id m1");
    expect(text).toContain("2. Read ch. 4 (task, in Rust) id t1");
  });
  it("marks notes to check before reading", () => {
    const hit = { kind: "milestone", id: "m1", title: "Auth", path: ["Rust"], snippet: null, href: "/x", page: 3 };
    expect(formatSearch("auth", [{ ...hit, anchorCommit: "abc1234ff", stale: true, proposed: true }], null, "keyword")).toContain(
      "id m1 [anchored @abc1234, flagged stale, replacement proposed]",
    );
    expect(formatSearch("auth", [{ ...hit, anchorCommit: "abc1234ff", anchorCommitAt: "2026-10-03T09:00:00Z" }], null, "keyword")).toContain(
      "id m1 [anchored @abc1234, committed 2026-10-03]",
    );
    expect(formatSearch("auth", [hit], null, "keyword")).toContain("id m1\n");
  });
  it("reports no matches plainly", () => {
    expect(formatSearch("zzz", [], null, "meaning")).toBe('Nothing in the notebook matches "zzz".');
  });
});

describe("formatNote", () => {
  const base = {
    id: "m1",
    page: 12,
    title: "Advisory locks",
    notes: "Use xact locks.",
    updatedAt: "2026-10-02T10:00:00Z",
    subject: { title: "Distributed Systems", isInbox: false },
    tasks: [{ id: "t1", title: "Try it", isCompleted: true, description: null, subtasks: [] }],
    anchorRepo: null,
    anchorCommit: null,
    anchorCommitAt: null,
    anchorFiles: [],
    checkedAt: null,
    checkedBy: null,
    staleReason: null,
    staleAt: null,
    staleBy: null,
    supersededBy: [],
    supersedes: null,
  };
  it("marks an agent's unwitnessed note and lists its plan", () => {
    const text = formatNote({ ...base, source: "claude-code", witnessedAt: null }, null);
    expect(text).toContain("# Advisory locks");
    expect(text).toContain("Page 12 · Subject: Distributed Systems");
    expect(text).toContain("Recorded by Claude Code · Not yet witnessed by the user");
    expect(text).toContain("Plan (1 of 1 tasks done):\n- [x] Try it (task t1)");
  });
  it("leaves the plan out when the note has no tasks", () => {
    expect(formatNote({ ...base, tasks: [], source: "web", witnessedAt: null }, null)).not.toContain("Plan");
  });
  it("calls the user's own note theirs", () => {
    expect(formatNote({ ...base, source: "web", witnessedAt: null }, "https://x/n")).toContain("Written by the user");
  });
  it("gives the code a note is about, and how to check it", () => {
    const text = formatNote(
      { ...base, source: "codex", witnessedAt: null, anchorRepo: "sky-walkerx/lockin", anchorCommit: "abc1234ff", anchorFiles: ["lib/auth.ts"] },
      null,
    );
    expect(text).toContain("Code: sky-walkerx/lockin @ abc1234: lib/auth.ts.");
    expect(text).toContain("`git diff --stat abc1234 -- lib/auth.ts`");
  });
  it("says when a note is replaced, proposed for replacing, or flagged", () => {
    const by = { id: "m2", page: 40, title: "Advisory locks, again", source: "codex", anchorCommit: null, anchorCommitAt: null };
    const own = { ...base, source: "web", witnessedAt: null };
    expect(formatNote({ ...own, supersededBy: [{ ...by, witnessedAt: "2026-10-03" }] }, null)).toContain(
      'REPLACED: p. 40, "Advisory locks, again" (id m2) replaces this note',
    );
    expect(formatNote({ ...own, supersededBy: [{ ...by, witnessedAt: null }] }, null)).toContain("Codex proposed a replacement");
    expect(formatNote({ ...own, staleReason: "locks moved", staleBy: "codex", staleAt: "2026-10-04T00:00:00Z" }, null)).toContain(
      "Flagged as possibly out of date by Codex on 2026-10-04: locks moved",
    );
    expect(
      formatNote({ ...own, supersedes: { id: "m0", page: 3, title: "Old", anchorCommit: null, anchorCommitAt: null } }, null),
    ).toContain('This note replaces p. 3, "Old" (id m0).');
  });
  it("dates both sides of a replacement by their commits", () => {
    const own = { ...base, source: "web", witnessedAt: null };
    const by = { id: "m2", page: 19, title: "xact locks", source: "codex", witnessedAt: "2026-10-18", anchorCommit: "9f8e7d6aa", anchorCommitAt: "2026-10-17T09:00:00Z" };
    expect(formatNote({ ...own, supersededBy: [by] }, null)).toContain(
      'REPLACED: p. 19, "xact locks" (id m2) (written @ 9f8e7d6, committed 2026-10-17) replaces this note',
    );
    const old = { id: "m0", page: 8, title: "Session locks", anchorCommit: "a1b2c3d", anchorCommitAt: "2026-10-03T09:00:00Z" };
    expect(formatNote({ ...own, supersedes: old }, null)).toContain(
      'This note replaces p. 8, "Session locks" (id m0) (written @ a1b2c3d, committed 2026-10-03).',
    );
  });
});

const sub = (id: string, title: string, parentId: string | null, notes = "", isCompleted = false) => ({
  id,
  title,
  parentId,
  notes,
  isCompleted,
});

const stack: PlanTask = {
  id: "t7",
  title: "Stack and queue",
  isCompleted: false,
  description: "Push, pop.\n\n```cpp\nstack<int> s;\n```",
  subtasks: [
    sub("s1", "Monotonic Stack", null, "Next greater element.", true),
    sub("s2", "Monotonic Deque", null),
    sub("s3", "Sliding max", "s2", "Keep indices."),
  ],
};

describe("formatTasks", () => {
  it("nests subtasks under their task and parent, with notes indented under each", () => {
    expect(formatTasks([stack])).toBe(
      [
        "- [ ] Stack and queue (task t7, 1 of 3 subtasks done)",
        "  Push, pop.",
        "",
        "  ```cpp",
        "  stack<int> s;",
        "  ```",
        "  - [x] Monotonic Stack (subtask s1)",
        "    Next greater element.",
        "  - [ ] Monotonic Deque (subtask s2)",
        "    - [ ] Sliding max (subtask s3)",
        "      Keep indices.",
      ].join("\n"),
    );
  });
  it("cuts long notes and points at get_note for the rest", () => {
    const long = { ...stack, description: "x".repeat(50), subtasks: [] };
    expect(formatTasks([long], 10)).toContain("  xxxxxxxxxx… (get_note t7 for the rest)");
  });
});

describe("formatPlanItem", () => {
  it("shows a task's notes, where it sits and its subtasks", () => {
    const text = formatPlanItem(
      { kind: "task", id: "t7", title: "Stack and queue", isCompleted: false, notes: "Push, pop.", path: ["CP", "ICPC"], subtasks: stack.subtasks },
      "https://nb.example/subjects/s?open=task:t7",
    );
    expect(text).toContain("# Stack and queue\nTask · Not done · In CP › ICPC\nhttps://nb.example/subjects/s?open=task:t7");
    expect(text).toContain("Push, pop.");
    expect(text).toContain("Subtasks:\n- [x] Monotonic Stack (subtask s1)\n  Next greater element.\n- [ ] Monotonic Deque (subtask s2)\n  - [ ] Sliding max (subtask s3)");
  });
  it("shows only what sits under a subtask", () => {
    const text = formatPlanItem(
      { kind: "subtask", id: "s2", title: "Monotonic Deque", isCompleted: false, notes: "", path: ["CP", "ICPC", "Stack and queue"], subtasks: stack.subtasks },
      null,
    );
    expect(text).toContain("Subtask · Not done · In CP › ICPC › Stack and queue");
    expect(text).toContain("(No notes yet.)");
    expect(text).toContain("Subtasks:\n- [ ] Sliding max (subtask s3)");
    expect(text).not.toContain("Monotonic Stack");
  });
  it("leaves the subtask list out when there's nothing under it", () => {
    const text = formatPlanItem(
      { kind: "subtask", id: "s3", title: "Sliding max", isCompleted: false, notes: "Keep indices.", path: [], subtasks: stack.subtasks },
      null,
    );
    expect(text).not.toContain("Subtasks:");
  });
});

describe("formatPlan", () => {
  const arrays: PlanTask = { id: "t1", title: "Arrays", isCompleted: true, description: null, subtasks: [] };
  it("groups tasks by note, then the tasks under no note, with totals", () => {
    const text = formatPlan(
      {
        subject: { title: "Competitive Programming", isInbox: false },
        notes: [
          { id: "m1", title: "ICPC", page: 3, tasks: [arrays, stack] },
          { id: "m2", title: "Codeforces", page: null, tasks: [] },
        ],
        loose: [{ id: "t9", title: "Join a team", isCompleted: false, description: null, subtasks: [] }],
      },
      "https://nb.example/subjects/s?tab=plan",
    );
    expect(text).toContain("# Plan for Competitive Programming\n1 of 3 tasks done, 1 of 3 subtasks done\nhttps://nb.example/subjects/s?tab=plan");
    expect(text).toContain("## ICPC (note m1, p. 3)\n- [x] Arrays (task t1)\n- [ ] Stack and queue");
    expect(text).toContain("## Not under a note\n- [ ] Join a team (task t9)");
    expect(text).toContain("Notes with nothing planned: Codeforces (m2)");
  });
  it("says so when nothing is planned", () => {
    expect(formatPlan({ subject: { title: "Inbox", isInbox: true }, notes: [], loose: [] }, null)).toBe(
      "Nothing is planned in the Inbox yet.",
    );
  });
});

describe("formatRelated", () => {
  it("lists the pages and how to link a replacement", () => {
    const text = formatRelated("new1", [
      {
        id: "m8",
        page: 8,
        title: "Use session locks for migrations",
        source: "claude-code",
        subjectTitle: "Database",
        isInbox: false,
        anchorCommit: "a1b2c3d9",
        anchorCommitAt: "2026-10-03T09:00:00Z",
      },
    ]);
    expect(text).toContain('- p. 8, "Use session locks for migrations" (id m8), in Database, by Claude Code @ a1b2c3d, committed 2026-10-03');
    expect(text).toContain("call link_replacement with id new1 and its id");
  });
  it("says nothing when no note looks related", () => {
    expect(formatRelated("new1", [])).toBe("");
  });
});
