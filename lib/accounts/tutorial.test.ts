import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TUTORIAL_NOTES, TUTORIAL_TASKS, TUTORIAL_TITLE } from "./tutorial-notes";

// What was written, in order.
const written: string[] = [];
let failAt: string | null = null;
const step = (what: string) => {
  if (failAt && what.startsWith(failAt)) throw new Error("database down");
  written.push(what);
};

vi.mock("@/lib/prisma", () => ({
  default: {
    subject: {
      create: async ({ data }: { data: { title: string } }) => (step(`subject ${data.title}`), { id: "s1" }),
    },
  },
}));
vi.mock("@/lib/notes/write", () => ({
  insertNote: async (_user: string, subjectId: string, input: { title: string; order: number; source?: string }) => {
    step(`note ${input.order} ${input.title} in ${subjectId}${input.source ? ` from ${input.source}` : ""}`);
    return { id: `n${input.order}` };
  },
}));
vi.mock("@/lib/tasks/create", () => ({
  createTask: async (_user: string, input: { title: string; milestoneId: string }) => (step(`task ${input.title} on ${input.milestoneId}`), {}),
}));

// The notes' renderer, without the stylesheet it brings in for the browser.
vi.mock("katex/dist/katex.min.css", () => ({}));

const { createTutorial } = await import("./tutorial");
const { Markdown } = await import("@/app/components/subject/markdown");

beforeEach(() => {
  written.length = 0;
  failAt = null;
});

describe("createTutorial", () => {
  it("writes the section, its notes in reading order as the owner's own, then the first page's tasks", async () => {
    expect(await createTutorial("u1")).toBe(true);
    expect(written).toEqual([
      `subject ${TUTORIAL_TITLE}`,
      ...TUTORIAL_NOTES.map((n, i) => `note ${i} ${n.title} in s1`),
      ...TUTORIAL_TASKS.map((t) => `task ${t} on n0`),
    ]);
  });

  it("never stops a sign-up: a failure is logged and reported, not thrown", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    failAt = "note 3";
    expect(await createTutorial("u1")).toBe(false);
    expect(written.at(-1)).toMatch(/^note 2 /);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});

describe("the tutorial's notes", () => {
  const render = (notes: string) => renderToStaticMarkup(Markdown({ page: 1, children: notes }));

  it.each(TUTORIAL_NOTES.map((n) => [n.title, n.notes]))("%s renders, with no broken maths", (_title, notes) => {
    const html = render(notes);
    expect(html).not.toContain("katex-error");
    // Every example shows its source as a figure and then reads as itself.
    if (notes.includes("What it reads as")) expect(html).toContain("<figure");
  });

  it("shows each example's source exactly as typed", () => {
    const html = render(TUTORIAL_NOTES.find((n) => n.title === "Maths")!.notes);
    expect(html).toContain("$e^{i\\pi} + 1 = 0$");
    expect(html).toContain('class="katex"');
    // Prices stay prices.
    expect(html).toContain("it cost $5, then $10.");
  });

  it("keeps the code example's own fence inside the figure", () => {
    const html = render(TUTORIAL_NOTES.find((n) => n.title === "Code")!.notes);
    expect(html).toContain("```python");
    expect(html).toContain("hljs");
  });
});
