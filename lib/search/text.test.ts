import { describe, expect, it } from "vitest";
import { makeSnippet, splitMatches } from "./text";

describe("makeSnippet", () => {
  it("cuts a window around the first match and marks the cut ends", () => {
    expect(makeSnippet("aaaa bbbb cccc SIEVE dddd eeee ffff", ["sieve"], 5)).toBe("…cccc SIEVE dddd…");
  });

  it("flattens code newlines and indentation into single spaces", () => {
    const notes = "for (int j = i * i; j <= n; j += i) {\n    isPrime[j] = 0;\n}";
    expect(makeSnippet(notes, ["isprime"], 100)).toBe("for (int j = i * i; j <= n; j += i) { isPrime[j] = 0; }");
  });

  it("leaves out code fence lines, which are markup rather than content", () => {
    const notes = "```cpp\n// segmented sieve\nvector<char> mark;\n```\n\nUse for big ranges.";
    expect(makeSnippet(notes, ["segmented"], 100)).toBe("// segmented sieve vector<char> mark; Use for big ranges.");
  });

  it("starts from the earliest match of any term", () => {
    expect(makeSnippet("one two three four", ["four", "two"], 3)).toBe("…ne two th…");
  });

  it("returns null when no term appears in the notes", () => {
    expect(makeSnippet("graphs and trees", ["sieve"])).toBeNull();
    expect(makeSnippet("", ["sieve"])).toBeNull();
  });
});

describe("splitMatches", () => {
  it("marks every occurrence regardless of case", () => {
    expect(splitMatches("Sieve of sieves", ["sieve"])).toEqual([
      { text: "Sieve", match: true },
      { text: " of ", match: false },
      { text: "sieve", match: true },
      { text: "s", match: false },
    ]);
  });

  it("merges overlapping matches from different terms", () => {
    expect(splitMatches("segmented", ["segment", "mented"])).toEqual([{ text: "segmented", match: true }]);
  });

  it("returns the text unmarked when nothing matches", () => {
    expect(splitMatches("graphs", ["sieve"])).toEqual([{ text: "graphs", match: false }]);
  });
});
