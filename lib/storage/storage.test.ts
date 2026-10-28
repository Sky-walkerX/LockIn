import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSignedUpload, isValidKey, localPath, looksLike, signUpload, storageDriver, verifyUpload } from "./index";

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

describe("looksLike", () => {
  const bytes = (...b: number[]) => new Uint8Array(b);
  const ascii = (t: string) => new TextEncoder().encode(t);

  it("knows each image type by its first bytes", () => {
    expect(looksLike("png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(true);
    expect(looksLike("jpg", bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(true);
    expect(looksLike("gif", ascii("GIF89a"))).toBe(true);
    expect(looksLike("webp", ascii("RIFF\x00\x00\x00\x00WEBPVP8 "))).toBe(true);
  });

  it("turns away a file named for a type it isn't", () => {
    expect(looksLike("png", ascii("<svg onload=alert(1)>"))).toBe(false);
    expect(looksLike("png", bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(false);
    expect(looksLike("webp", ascii("RIFF\x00\x00\x00\x00WAVEfmt "))).toBe(false);
    expect(looksLike("jpg", bytes())).toBe(false);
  });

  it("leaves PDFs alone", () => {
    expect(looksLike("pdf", ascii("anything"))).toBe(true);
  });
});

describe("createSignedUpload", () => {
  it("signs a link for the key and exactly the size asked for", () => {
    vi.stubEnv("STORAGE_DRIVER", "local");
    const key = "lockin-notes/u/a.png";
    const { uploadUrl, publicUrl } = createSignedUpload(key, 1234, "https://notes.test");
    expect(publicUrl).toBe(`https://notes.test/api/files/${key}`);
    const q = new URL(uploadUrl).searchParams;
    expect(new URL(uploadUrl).pathname).toBe("/api/files/upload");
    expect(q.get("key")).toBe(key);
    expect(q.get("max")).toBe("1234");
    expect(verifyUpload(key, Number(q.get("exp")), 1234, q.get("sig")!)).toBe(true);
    expect(verifyUpload(key, Number(q.get("exp")), 1235, q.get("sig")!)).toBe(false);
  });
});
