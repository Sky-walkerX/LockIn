import { describe, expect, it } from "vitest";
import { slugify, validTimeZone } from "./download";

describe("slugify", () => {
  it("makes a safe file name", () => {
    expect(slugify("Operating Systems (GATE '27)")).toBe("operating-systems-gate-27");
    expect(slugify("Réseaux")).toBe("reseaux");
    expect(slugify("数学")).toBe("subject");
  });
});

describe("validTimeZone", () => {
  it("keeps a real zone and falls back to UTC otherwise", () => {
    expect(validTimeZone("Asia/Kolkata")).toBe("Asia/Kolkata");
    expect(validTimeZone("Mars/Olympus")).toBe("UTC");
    expect(validTimeZone(null)).toBe("UTC");
  });
});
