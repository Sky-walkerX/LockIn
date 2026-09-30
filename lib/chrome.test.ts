import { describe, expect, it } from "vitest";
import { isChromeless } from "./chrome";

describe("isChromeless", () => {
  it("keeps the auth and share pages chromeless", () => {
    expect(isChromeless("/login")).toBe(true);
    expect(isChromeless("/share/abc")).toBe(true);
  });

  it("keeps the chrome on notebook pages", () => {
    expect(isChromeless("/")).toBe(false);
    expect(isChromeless("/inbox")).toBe(false);
    expect(isChromeless("/subjects/x")).toBe(false);
  });
});
