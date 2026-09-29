import { describe, expect, it } from "vitest";
import { subjectToMarkdown, type ExportSubject } from "./markdown";

const base: ExportSubject = {
  title: "Operating Systems",
  description: "GATE prep",
  targetDate: null,
  milestones: [],
  tasks: [],
  resources: [],
};

const task = (over: Partial<ExportSubject["tasks"][number]> = {}): ExportSubject["tasks"][number] => ({
  title: "Task",
  description: null,
  isCompleted: false,
  dueDate: null,
  priority: "MEDIUM",
  estimatedTime: null,
  timeSpent: null,
  subtasks: [],
  ...over,
});

const opts = { timeZone: "Asia/Kolkata", exportedAt: new Date("2026-09-23T10:00:00Z") };

describe("subjectToMarkdown", () => {
  it("opens with the title, description and export date", () => {
    const md = subjectToMarkdown(base, opts);
    expect(md.startsWith("# Operating Systems\n\nGATE prep\n\n")).toBe(true);
    expect(md).toContain("- Exported: 23 Sep 2026");
  });

  it("writes milestones as sections with their notes and a checklist", () => {
    const md = subjectToMarkdown(
      {
        ...base,
        milestones: [
          {
            title: "Paging",
            notes: "## TLB\nCaches entries.",
            isCompleted: true,
            confidence: "WEAK",
            reviewDueAt: "2026-09-25T04:00:00Z",
            weight: 7.8,
            tasks: [task({ title: "Read chapter", isCompleted: true }), task({ title: "Problems" })],
          },
        ],
      },
      opts,
    );
    expect(md).toContain("## ✓ Paging\n\n*Confidence: weak · next review 25 Sep 2026 · weight 7.8*\n\n### TLB\nCaches entries.");
    expect(md).toContain("- [x] Read chapter\n- [ ] Problems");
  });

  it("puts task details after an em dash, dates in the reader's zone", () => {
    const md = subjectToMarkdown(
      {
        ...base,
        tasks: [
          task({
            title: "Mock test",
            // 20:00 UTC is already the next day in India
            dueDate: "2026-10-01T20:00:00Z",
            priority: "HIGH",
            estimatedTime: 120,
            timeSpent: 90,
          }),
        ],
      },
      opts,
    );
    expect(md).toContain("- [ ] Mock test — due 2 Oct 2026 · high priority · est 2h · 1h 30m logged");
  });

  it("indents task notes and nested subtasks under their item", () => {
    const md = subjectToMarkdown(
      {
        ...base,
        tasks: [
          task({
            title: "Parent",
            description: "Line one\nLine two",
            subtasks: [
              {
                title: "Sub",
                notes: "",
                isCompleted: true,
                children: [{ title: "Child", notes: "Child note", isCompleted: false }],
              },
            ],
          }),
        ],
      },
      opts,
    );
    expect(md).toContain(
      "- [ ] Parent\n  Line one\n  Line two\n  - [x] Sub\n    - [ ] Child\n      Child note",
    );
  });

  it("lists loose tasks and resources in their own sections", () => {
    const md = subjectToMarkdown(
      {
        ...base,
        milestones: [{ title: "M", notes: "", isCompleted: false, confidence: null, reviewDueAt: null, weight: 1, tasks: [] }],
        tasks: [task({ title: "Loose" })],
        resources: [
          { title: "OSTEP", url: "https://ostep.org", type: "BOOK", note: "Ch 18-20" },
          { title: "Chat", url: "https://x.ai/c", type: "AI_CHAT", note: null },
        ],
      },
      opts,
    );
    expect(md).toContain("## Other tasks\n\n- [ ] Loose");
    expect(md).toContain("## Resources\n\n- [OSTEP](https://ostep.org) — book · Ch 18-20\n- [Chat](https://x.ai/c) — AI chat");
  });

  it("leaves out empty sections and default metadata", () => {
    const md = subjectToMarkdown(
      { ...base, milestones: [{ title: "M", notes: "", isCompleted: false, confidence: null, reviewDueAt: null, weight: 1, tasks: [] }] },
      opts,
    );
    expect(md).not.toContain("Other tasks");
    expect(md).not.toContain("Resources");
    expect(md).not.toContain("*Confidence");
    expect(md).toContain("## M\n");
  });

  it("names the target date when there is one", () => {
    expect(subjectToMarkdown({ ...base, targetDate: "2026-11-22T18:29:59Z" }, opts)).toContain("- Target: 22 Nov 2026");
  });

  // Milestones are level-2 sections, so a note's own "## Heading" would read as
  // a sibling milestone. The note's headings all shift by the same amount, so
  // its own hierarchy survives; code blocks are left exactly as written.
  it("nests note headings under their milestone, but not inside code", () => {
    const md = subjectToMarkdown(
      {
        ...base,
        milestones: [
          {
            title: "M",
            notes: "# Top\n## Sub\n```sh\n# a comment\n```\n###### Deep",
            isCompleted: false,
            confidence: null,
            reviewDueAt: null,
            weight: 1,
            tasks: [],
          },
        ],
      },
      opts,
    );
    expect(md).toContain("### Top\n#### Sub\n```sh\n# a comment\n```\n###### Deep");
  });
});
