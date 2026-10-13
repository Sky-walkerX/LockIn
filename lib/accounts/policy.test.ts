import { afterEach, describe, expect, it, vi } from "vitest";
import { appOrigin, normalizeEmail, signupOpen } from "./policy";

afterEach(() => vi.unstubAllEnvs());

describe("signupOpen", () => {
  it("is open unless the instance says closed", () => {
    vi.stubEnv("SIGNUP", "");
    expect(signupOpen()).toBe(true);
    vi.stubEnv("SIGNUP", "open");
    expect(signupOpen()).toBe(true);
    vi.stubEnv("SIGNUP", " Closed ");
    expect(signupOpen()).toBe(false);
  });
});

describe("appOrigin", () => {
  const forged = new Request("http://internal:3000/api/account/reset/request", {
    headers: { host: "evil.example", "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" },
  });

  it("uses the configured address, whatever the request claims", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://notes.example.com/");
    expect(appOrigin(forged)).toBe("https://notes.example.com");
  });

  it("falls back to the request when nothing is configured", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    expect(appOrigin(forged)).toBe("https://evil.example");
  });
});

describe("normalizeEmail", () => {
  it("makes one account of an address typed two ways", () => {
    expect(normalizeEmail("  Ada.L@Example.COM ")).toBe("ada.l@example.com");
  });
});
