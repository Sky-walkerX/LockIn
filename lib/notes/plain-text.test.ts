import { describe, expect, it } from "vitest";
import { findQuote, passageQuote, plainText } from "./plain-text";

describe("plainText", () => {
  it("drops markdown markers and code blocks", () => {
    expect(plainText("## Heading\n- **Bold** and `code`\n```js\nx()\n```\ntext")).toBe("Heading Bold and code text");
  });
});

describe("passageQuote", () => {
  it("keeps a short passage whole and cuts a long one at a word", () => {
    expect(passageQuote("One owner per value.")).toBe("One owner per value.");
    const q = passageQuote("word ".repeat(60));
    expect(q.length).toBeLessThanOrEqual(100);
    expect(q.endsWith("word")).toBe(true);
  });
});

describe("findQuote", () => {
  const page = "Ownership\n\nEvery value in Rust has exactly one   owner. When the owner goes out of scope, Rust drops it.";

  it("finds a quote across different whitespace and case", () => {
    const [s, e] = findQuote(page, "every value in rust has exactly one owner.")!;
    expect(page.slice(s, e)).toBe("Every value in Rust has exactly one   owner.");
  });

  it("falls back to the opening words when the rest doesn't match the rendered text", () => {
    const [s, e] = findQuote(page, "Every value in Rust has exactly one owner (see https://doc.rust-lang.org)")!;
    expect(page.slice(s, e)).toBe("Every value in Rust has exactly one   owner");
  });

  it("gives up rather than match a couple of common words", () => {
    expect(findQuote(page, "the cat sat on a mat")).toBeNull();
    expect(findQuote(page, "")).toBeNull();
  });
});
