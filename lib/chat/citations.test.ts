import { describe, expect, it } from "vitest";
import { citedPages, linkCitations } from "./citations";

describe("citedPages", () => {
  it("finds single and grouped citations in order of first mention", () => {
    expect(citedPages("Moves on assignment [p. 12]. Copy types don't [p. 31, p. 12].")).toEqual([12, 31]);
  });

  it("accepts the variations models drift into", () => {
    expect(citedPages("a [p.4] b [pp. 5, 6] c [p. 7; p. 8] d [ p. 9 ]")).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it("ignores citations inside code", () => {
    const text = "See [p. 2].\n\n```py\nx = data[p. 3]\n```\n\nAnd `arr[p. 4]` too.";
    expect(citedPages(text)).toEqual([2]);
  });

  it("ignores things that only look like pages", () => {
    expect(citedPages("Read chapter 4, page 12 of the book [12] (p. 3).")).toEqual([]);
  });
});

describe("linkCitations", () => {
  it("links each known page", () => {
    expect(linkCitations("Moves [p. 12, p. 31].", new Set([12, 31]))).toBe("Moves [p. 12](#cite-12) [p. 31](#cite-31).");
  });

  it("leaves a page the model made up as plain text", () => {
    expect(linkCitations("Claim [p. 12, p. 99].", new Set([12]))).toBe("Claim [p. 12](#cite-12) p. 99.");
  });

  it("doesn't touch code", () => {
    const text = "```\nv[p. 1]\n```\n`w[p. 1]` [p. 1]";
    expect(linkCitations(text, new Set([1]))).toBe("```\nv[p. 1]\n```\n`w[p. 1]` [p. 1](#cite-1)");
  });

  it("keeps an unterminated fence (a reply still streaming) as code", () => {
    expect(linkCitations("[p. 1]\n```\nstill [p. 1] typing", new Set([1]))).toBe("[p. 1](#cite-1)\n```\nstill [p. 1] typing");
  });
});
