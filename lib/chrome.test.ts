import { describe, expect, it } from "vitest";
import { isChromeless } from "./chrome";

describe("isChromeless", () => {
  it("shows visitors the landing page at / without the chrome", () => {
    expect(isChromeless("/", false)).toBe(true);
    expect(isChromeless("/", true)).toBe(false);
  });

  it("keeps the auth and share pages chromeless either way", () => {
    for (const signedIn of [true, false]) {
      expect(isChromeless("/login", signedIn)).toBe(true);
      expect(isChromeless("/share/abc", signedIn)).toBe(true);
      expect(isChromeless("/oauth/authorize", signedIn)).toBe(true);
    }
  });

  it("keeps the chrome on notebook pages", () => {
    expect(isChromeless("/inbox", true)).toBe(false);
    expect(isChromeless("/subjects/x", true)).toBe(false);
  });
});
