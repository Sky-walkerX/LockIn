import { afterEach, describe, expect, it, vi } from "vitest";
import { operator } from "./operator";

afterEach(() => vi.unstubAllEnvs());

describe("operator", () => {
  it("is nobody unless an address is set, so the pages don't exist", () => {
    vi.stubEnv("OPERATOR_EMAIL", "");
    vi.stubEnv("OPERATOR_NAME", "Ada");
    expect(operator()).toBeNull();
    vi.stubEnv("OPERATOR_EMAIL", "   ");
    expect(operator()).toBeNull();
  });

  it("needs only the address; the name and where it's hosted are extra", () => {
    vi.stubEnv("OPERATOR_EMAIL", " ada@example.com ");
    vi.stubEnv("OPERATOR_NAME", "");
    vi.stubEnv("OPERATOR_HOSTING", "");
    expect(operator()).toEqual({ email: "ada@example.com", name: null, hosting: null });
    vi.stubEnv("OPERATOR_NAME", "Ada Lovelace");
    vi.stubEnv("OPERATOR_HOSTING", "In Frankfurt.");
    expect(operator()).toEqual({ email: "ada@example.com", name: "Ada Lovelace", hosting: "In Frankfurt." });
  });
});
