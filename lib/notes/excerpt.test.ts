import { describe, expect, it } from "vitest";
import { excerpt } from "./excerpt";

describe("excerpt", () => {
  it("keeps prose and drops fenced code", () => {
    const md = "Every value has one **owner**.\n\n```rust\nlet s2 = s1;\n```\n\nThen it moves.";
    expect(excerpt(md)).toBe("Every value has one owner. Then it moves.");
  });

  it("strips headings, quotes, list and task marks, and keeps link text", () => {
    const md = "### Borrowing\n- one `&mut` reference\n- [x] read [the book](https://x.dev)\n> never both";
    expect(excerpt(md)).toBe("Borrowing one &mut reference read the book never both");
  });

  it("drops images entirely", () => {
    expect(excerpt("![diagram](https://x.dev/a.png) Page tables nest.")).toBe("Page tables nest.");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const md = "alpha beta gamma delta epsilon zeta eta theta";
    expect(excerpt(md, 20)).toBe("alpha beta gamma…");
  });

  it("returns an empty string for a note that is only code", () => {
    expect(excerpt("```\nonly code\n```")).toBe("");
  });

  it("leaves snake_case and arithmetic alone", () => {
    expect(excerpt("call read_to_string and 2 * 3 * 4")).toBe("call read_to_string and 2 * 3 * 4");
  });
});
