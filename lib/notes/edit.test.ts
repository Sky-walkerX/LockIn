import { describe, expect, it } from "vitest";
import { replaceOnce } from "./edit";

describe("replaceOnce", () => {
  it("swaps the one passage that matches", () => {
    expect(replaceOnce("## A\n\nold line\n\n## B", "old line", "new line")).toEqual({ ok: true, text: "## A\n\nnew line\n\n## B" });
  });
  it("deletes a passage when the replacement is empty", () => {
    expect(replaceOnce("keep. drop. keep.", " drop.", "")).toEqual({ ok: true, text: "keep. keep." });
  });
  it("refuses a passage that isn't there", () => {
    expect(replaceOnce("text", "missing", "x")).toEqual({ ok: false, matches: 0 });
    expect(replaceOnce("text", "", "x")).toEqual({ ok: false, matches: 0 });
  });
  it("refuses a passage that appears more than once, saying how often", () => {
    expect(replaceOnce("a b a b a", "a", "c")).toEqual({ ok: false, matches: 3 });
  });
  it("treats $ in the replacement literally", () => {
    expect(replaceOnce("x", "x", "$e_K$ and $&")).toEqual({ ok: true, text: "$e_K$ and $&" });
  });
});
