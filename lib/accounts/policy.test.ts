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

  it("takes Vercel's production domain when that's all there is", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lockin.example.com");
    expect(appOrigin(forged)).toBe("https://lockin.example.com");
  });

  it("goes by the request only outside production", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(appOrigin(forged)).toBe("https://evil.example");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => appOrigin(forged)).toThrow(/NEXTAUTH_URL/);
  });
});

describe("normalizeEmail", () => {
  it("makes one account of an address typed two ways", () => {
    expect(normalizeEmail("  Ada.L@Example.COM ")).toBe("ada.l@example.com");
  });
});
