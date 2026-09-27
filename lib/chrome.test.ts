import { describe, expect, it } from "vitest";
import { isChromeless } from "./chrome";

describe("isChromeless", () => {
  it("keeps the auth pages chromeless", () => {
    expect(isChromeless("/login")).toBe(true);
  });

  it("keeps the chrome on notebook pages", () => {
    expect(isChromeless("/")).toBe(false);
    expect(isChromeless("/subjects/x")).toBe(false);
  });
});
