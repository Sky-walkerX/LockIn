import { describe, expect, it } from "vitest";
import { likePatterns, parseTerms } from "./query";

describe("parseTerms", () => {
  it("splits on whitespace, lowercases and drops repeats", () => {
    expect(parseTerms("  Segmented   SIEVE sieve ")).toEqual(["segmented", "sieve"]);
  });

  it("drops one-letter terms, which would match nearly every row", () => {
    expect(parseTerms("a sieve")).toEqual(["sieve"]);
    expect(parseTerms("i")).toEqual([]);
  });

  it("keeps at most five terms", () => {
    expect(parseTerms("aa bb cc dd ee ff gg")).toEqual(["aa", "bb", "cc", "dd", "ee"]);
  });
});

describe("likePatterns", () => {
  it("wraps each term for a contains match", () => {
    expect(likePatterns(["sieve"])).toEqual(["%sieve%"]);
  });

  it("escapes LIKE wildcards so they match literally", () => {
    expect(likePatterns(["50%", "a_b", "c\\d"])).toEqual(["%50\\%%", "%a\\_b%", "%c\\\\d%"]);
  });
});
