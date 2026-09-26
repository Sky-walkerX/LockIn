import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps a path on this site", () => {
    expect(safeNext("/oauth/authorize?client_id=x&state=y")).toBe("/oauth/authorize?client_id=x&state=y");
  });

  it("falls back home for anything that could leave the site", () => {
    for (const v of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)"]) {
      expect(safeNext(v)).toBe("/");
    }
  });
});
