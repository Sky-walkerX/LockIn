import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A stand-in for the StoredFile table, just enough of it for the quota's own
// queries, and one for Supabase Storage: which files it holds, and how big.
type Row = { key: string; userId: string; bytes: number; createdAt: Date };
const rows = new Map<string, Row>();
const stored = new Map<string, number>();
let storageDown = false;

type Where = { key?: string | { startsWith: string }; userId?: string; bytes?: number; createdAt?: { lt?: Date; gt?: Date } };
const matching = (where: Where) =>
  [...rows.values()].filter(
    (r) =>
      (where.key === undefined || (typeof where.key === "string" ? r.key === where.key : r.key.startsWith(where.key.startsWith))) &&
      (where.userId === undefined || r.userId === where.userId) &&
      (where.bytes === undefined || r.bytes === where.bytes) &&
      (where.createdAt?.lt === undefined || r.createdAt < where.createdAt.lt) &&
      (where.createdAt?.gt === undefined || r.createdAt > where.createdAt.gt),
  );

vi.mock("@/lib/prisma", () => ({
  default: {
    storedFile: {
      aggregate: async ({ where }: { where: Where }) => ({ _sum: { bytes: matching(where).reduce((sum, r) => sum + r.bytes, 0) } }),
      upsert: async ({ where, create, update }: { where: { key: string }; create: Omit<Row, "createdAt">; update: { bytes: number } }) => {
        const row = rows.get(where.key);
        if (row) row.bytes = update.bytes;
        else rows.set(where.key, { ...create, createdAt: new Date() });
      },
      findMany: async ({ where }: { where: Where }) => matching(where).map((r) => ({ key: r.key })),
      updateMany: async ({ where, data }: { where: Where; data: { bytes: number } }) => {
        const found = matching(where);
        for (const r of found) r.bytes = data.bytes;
        return { count: found.length };
      },
      deleteMany: async ({ where }: { where: Where }) => {
        const found = matching(where);
        for (const r of found) rows.delete(r.key);
        return { count: found.length };
      },
    },
  },
}));

const { MAX_PDF_BYTES, forgetFile, holdUpload, removeFile, settleUpload, storageUsed } = await import("./quota");

const MB = 1024 * 1024;
const USER = "user-1";
const pdf = (n: number) => `lockin-docs/${USER}/00000000-0000-4000-8000-${String(n).padStart(12, "0")}.pdf`;
const hoursAgo = (key: string, hours: number) => (rows.get(key)!.createdAt = new Date(Date.now() - hours * 60 * 60 * 1000));

beforeEach(() => {
  rows.clear();
  stored.clear();
  storageDown = false;
  vi.stubEnv("SUPABASE_URL", "https://storage.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  vi.stubEnv("STORAGE_QUOTA_MB", "100");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (storageDown) return new Response("{}", { status: 503 });
    const key = url.split(/\/object\/(?:info\/)?/)[1];
    if (!stored.has(key)) return Response.json({ statusCode: "404", error: "not_found" }, { status: 400 });
    if (init?.method === "DELETE") {
      stored.delete(key);
      return Response.json({});
    }
    return Response.json({ size: stored.get(key) });
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("room held for an upload to Supabase", () => {
  it("is the most the link allows, whatever size the browser gave", async () => {
    expect(await holdUpload(USER, pdf(1), 1)).toBe(true);
    expect(await storageUsed(USER)).toBe(MAX_PDF_BYTES);
  });

  it("is settled at the file's real size when the resource is saved", async () => {
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 3 * MB);
    expect(await settleUpload(USER, pdf(1))).toBe(true);
    expect(await storageUsed(USER)).toBe(3 * MB);
  });

  it("can't all be granted to links asked for in the same moment", async () => {
    const asked = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => holdUpload(USER, pdf(n), 40 * MB)));
    const granted = asked.filter(Boolean).length;
    expect(granted).toBeLessThanOrEqual(2);
    expect(await storageUsed(USER)).toBe(granted * MAX_PDF_BYTES);
  });

  it("is refused, and nothing stays held, when the file wouldn't fit", async () => {
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 45 * MB);
    await settleUpload(USER, pdf(1));
    await holdUpload(USER, pdf(2), 1);
    stored.set(pdf(2), 45 * MB);
    await settleUpload(USER, pdf(2));
    expect(await holdUpload(USER, pdf(3), 20 * MB)).toBe(false);
    expect(await storageUsed(USER)).toBe(90 * MB);
    expect(await holdUpload(USER, pdf(4), 5 * MB)).toBe(true);
  });

  it("is let go once the link has run out and nothing arrived", async () => {
    await holdUpload(USER, pdf(1), 1);
    hoursAgo(pdf(1), 3);
    await holdUpload(USER, pdf(2), 1);
    expect(rows.has(pdf(1))).toBe(false);
    expect(await storageUsed(USER)).toBe(MAX_PDF_BYTES);
  });

  it("stays held while the link still works, or while Supabase can't say", async () => {
    await holdUpload(USER, pdf(1), 1);
    await holdUpload(USER, pdf(2), 1);
    expect(rows.get(pdf(1))?.bytes).toBe(MAX_PDF_BYTES);
    hoursAgo(pdf(1), 3);
    storageDown = true;
    await holdUpload(USER, pdf(3), 1).catch(() => {});
    expect(rows.get(pdf(1))?.bytes).toBe(MAX_PDF_BYTES);
  });

  it("becomes the file's size when one arrived but its resource was never saved", async () => {
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 7 * MB);
    hoursAgo(pdf(1), 3);
    await holdUpload(USER, pdf(2), 1);
    expect(rows.get(pdf(1))?.bytes).toBe(7 * MB);
  });
});

describe("a file that goes over the quota when settled", () => {
  it("is removed, and its room held until the link can't put it back", async () => {
    vi.stubEnv("STORAGE_QUOTA_MB", "40");
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 45 * MB);
    expect(await settleUpload(USER, pdf(1))).toBe(false);
    expect(stored.has(pdf(1))).toBe(false);
    expect(rows.get(pdf(1))?.bytes).toBe(MAX_PDF_BYTES);
  });

  it("stays counted when it couldn't be removed", async () => {
    vi.stubEnv("STORAGE_QUOTA_MB", "40");
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 45 * MB);
    const real = fetch;
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => (init?.method === "DELETE" ? new Response("{}", { status: 500 }) : real(url, init)));
    expect(await settleUpload(USER, pdf(1))).toBe(false);
    expect(stored.has(pdf(1))).toBe(true);
    expect(rows.get(pdf(1))?.bytes).toBe(45 * MB);
  });
});

describe("a removed file", () => {
  it("keeps its room while its upload link could put it back", async () => {
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 1);
    await settleUpload(USER, pdf(1));
    await removeFile(pdf(1), "test");
    expect(stored.has(pdf(1))).toBe(false);
    expect(await storageUsed(USER)).toBe(MAX_PDF_BYTES);
  });

  it("is forgotten once the link has run out", async () => {
    await holdUpload(USER, pdf(1), 1);
    stored.set(pdf(1), 9 * MB);
    await settleUpload(USER, pdf(1));
    hoursAgo(pdf(1), 3);
    await removeFile(pdf(1), "test");
    expect(await storageUsed(USER)).toBe(0);
  });

  it("is forgotten at once on local disk and for images, which have no such link", async () => {
    const image = `lockin-notes/${USER}/00000000-0000-4000-8000-000000000001.png`;
    rows.set(image, { key: image, userId: USER, bytes: MB, createdAt: new Date() });
    await forgetFile(image);
    expect(rows.has(image)).toBe(false);

    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    rows.set(pdf(1), { key: pdf(1), userId: USER, bytes: MB, createdAt: new Date() });
    await forgetFile(pdf(1));
    expect(rows.has(pdf(1))).toBe(false);
  });
});
