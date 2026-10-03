import { describe, expect, it } from "vitest";
import { formatNote, formatPlan, formatPlanItem, formatSearch, formatSubjects, formatTasks, type PlanTask } from "./format";

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
