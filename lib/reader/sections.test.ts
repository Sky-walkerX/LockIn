import { describe, expect, it } from "vitest";
import { findSection, splitSections } from "./sections";

describe("splitSections", () => {
  it("starts a section at each heading", () => {
    const s = splitSections("intro\n\n# One\nbody one\n\n## Two\nbody two");
    expect(s).toEqual(["intro", "# One\nbody one", "## Two\nbody two"]);
  });

  it("doesn't split on a # inside fenced code", () => {
    const s = splitSections("# A\n```sh\n# not a heading\n```\nafter");
    expect(s).toEqual(["# A\n```sh\n# not a heading\n```\nafter"]);
  });

  it("breaks a long heading-less text at paragraph boundaries", () => {
    const para = "word ".repeat(200).trim(); // ~1000 chars
    const text = Array.from({ length: 10 }, () => para).join("\n\n");
    const s = splitSections(text, 3000);
    expect(s.length).toBeGreaterThan(1);
    expect(s.every((x) => x.length <= 3000)).toBe(true);
    expect(s.join("\n\n")).toBe(text);
  });

  it("never splits inside a code block to meet the size", () => {
    const code = "```\n" + "x\n\n".repeat(2000) + "```";
    const s = splitSections(`# A\n${code}`, 1000);
    expect(s).toEqual([`# A\n${code}`]);
  });

  it("drops empty sections", () => {
    expect(splitSections("\n\n# A\n\n\n")).toEqual(["# A"]);
    expect(splitSections("")).toEqual([]);
  });
});

describe("findSection", () => {
  const sections = ["# Intro\nHello", "# Paging\nThe TLB caches\npage table entries.", "# End"];

  it("finds the section containing the passage, ignoring case and line breaks", () => {
    expect(findSection(sections, "the tlb caches page table")).toBe(1);
  });

  it("matches on the passage's opening words when the whole of it isn't there", () => {
    expect(findSection(sections, "The TLB caches page table entries, and then some text that differs")).toBe(1);
  });

  it("returns -1 when nothing matches", () => {
    expect(findSection(sections, "segmentation")).toBe(-1);
    expect(findSection(sections, "")).toBe(-1);
  });
});
