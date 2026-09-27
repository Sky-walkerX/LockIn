import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidKey, localPath, signUpload, storageDriver, verifyUpload } from "./index";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret");
  vi.stubEnv("STORAGE_DIR", "/tmp/lockin-storage");
});
afterEach(() => vi.unstubAllEnvs());

describe("storage keys", () => {
  it("accepts only bucket/user/uuid.ext", () => {
    expect(isValidKey("lockin-docs/u-1/ab12-cd34.pdf")).toBe(true);
    expect(isValidKey("lockin-notes/u-1/x.png")).toBe(true);
    expect(isValidKey("lockin-docs/u-1/../../etc/passwd")).toBe(false);
    expect(isValidKey("other-bucket/u/x.pdf")).toBe(false);
    expect(isValidKey("lockin-docs/u/x.exe")).toBe(false);
    expect(isValidKey("lockin-docs/u/sub/x.pdf")).toBe(false);
  });

  it("maps a key under the storage folder and nowhere else", () => {
    expect(localPath("lockin-docs/u/x.pdf")).toBe("/tmp/lockin-storage/lockin-docs/u/x.pdf");
    expect(localPath("lockin-docs/../x.pdf")).toBeNull();
  });
});

describe("signed uploads", () => {
  it("verifies its own token for the same key, size and expiry", () => {
    const key = "lockin-docs/u/a.pdf";
    const { exp, max, sig } = signUpload(key, 1000);
    expect(verifyUpload(key, exp, max, sig)).toBe(true);
  });

  it("rejects a token moved to another key, a raised cap, or a forged signature", () => {
    const { exp, max, sig } = signUpload("lockin-docs/u/a.pdf", 1000);
    expect(verifyUpload("lockin-docs/u/b.pdf", exp, max, sig)).toBe(false);
    expect(verifyUpload("lockin-docs/u/a.pdf", exp, 10_000_000, sig)).toBe(false);
    expect(verifyUpload("lockin-docs/u/a.pdf", exp, max, "forged")).toBe(false);
  });

  it("rejects an expired token", () => {
    const { max, sig } = signUpload("lockin-docs/u/a.pdf", 1000, -60);
    const past = Math.floor(Date.now() / 1000) - 60;
    expect(verifyUpload("lockin-docs/u/a.pdf", past, max, sig)).toBe(false);
  });
});

describe("storageDriver", () => {
  it("uses Supabase when it's configured, local disk otherwise", () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(storageDriver()).toBe("local");
    vi.stubEnv("SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "k");
    expect(storageDriver()).toBe("supabase");
    vi.stubEnv("STORAGE_DRIVER", "local");
    expect(storageDriver()).toBe("local");
  });
});
