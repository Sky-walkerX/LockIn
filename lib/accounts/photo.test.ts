import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The account's row and what happened to files, in order.
let image: string | null = null;
let exists = true;
let room = true;
const happened: string[] = [];

const tx = {
  $queryRaw: async () => (exists ? [{ image }] : []),
  user: { update: async ({ data }: { data: { image: string | null } }) => ((image = data.image), happened.push(`set ${data.image}`)) },
};
vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: async (run: (t: typeof tx) => unknown) => run(tx),
    user: { findUnique: async () => (exists ? { image } : null) },
  },
}));
vi.mock("@/lib/storage", async (load) => ({
  ...(await load<typeof import("@/lib/storage")>()),
  putObject: async (_bucket: string, path: string, _body: Blob, origin: string) => (happened.push(`put ${path}`), `${origin}/api/files/lockin-notes/${path}`),
}));
vi.mock("@/lib/storage/quota", () => ({
  fitsQuota: async () => room,
  withinQuota: async () => room,
  recordFile: async (_user: string, key: string) => happened.push(`count ${key}`),
  removeFile: async (key: string) => happened.push(`remove ${key}`),
}));
vi.mock("./policy", () => ({ configuredOrigin: () => "https://notebook.test" }));

const { storePhoto, clearPhoto, copyGooglePhoto } = await import("./photo");

const USER = "11111111-2222-3333-4444-555555555555";
const photo = () => new Blob([new Uint8Array(10)], { type: "image/webp" });
const ours = (name: string) => `https://notebook.test/api/files/lockin-notes/${USER}/${name}`;

beforeEach(() => {
  image = null;
  exists = true;
  room = true;
  happened.length = 0;
});
afterEach(() => vi.unstubAllGlobals());

describe("storePhoto", () => {
  it("stores and counts the photo, then removes the file of the one it replaces", async () => {
    image = ours("photo-old.webp");
    const url = await storePhoto(USER, photo(), "https://notebook.test");
    expect(url).toMatch(new RegExp(`/api/files/lockin-notes/${USER}/photo-.+\\.webp$`));
    expect(image).toBe(url);
    expect(happened.map((h) => h.split(" ")[0])).toEqual(["put", "count", "set", "remove"]);
    expect(happened.at(-1)).toBe(`remove lockin-notes/${USER}/photo-old.webp`);
  });

  it("leaves alone a photo that isn't one of this user's files", async () => {
    image = "https://lh3.googleusercontent.com/a/someone=s96-c";
    await storePhoto(USER, photo(), "https://notebook.test");
    expect(happened.some((h) => h.startsWith("remove"))).toBe(false);

    image = "https://notebook.test/api/files/lockin-notes/99999999-2222-3333-4444-555555555555/photo-x.webp";
    happened.length = 0;
    await storePhoto(USER, photo(), "https://notebook.test");
    expect(happened.some((h) => h.startsWith("remove"))).toBe(false);
  });

  it("stores nothing when there's no room", async () => {
    room = false;
    expect(await storePhoto(USER, photo(), "https://notebook.test")).toBeNull();
    expect(happened).toEqual([]);
  });

  it("removes the new file when the account went in the meantime", async () => {
    exists = false;
    expect(await storePhoto(USER, photo(), "https://notebook.test")).toBeNull();
    expect(happened.at(-1)).toMatch(/^remove lockin-notes\/.+\/photo-/);
  });
});

it("removes the new file when the database fails, and says so", async () => {
  const failing = vi.spyOn(tx.user, "update").mockRejectedValueOnce(new Error("database down"));
  await expect(storePhoto(USER, photo(), "https://notebook.test")).rejects.toThrow("database down");
  expect(happened.at(-1)).toMatch(/^remove lockin-notes\/.+\/photo-/);
  failing.mockRestore();
});

describe("clearPhoto", () => {
  it("takes the photo away and removes its file", async () => {
    image = ours("photo-a.webp");
    await clearPhoto(USER);
    expect(image).toBeNull();
    expect(happened).toEqual(["set null", `remove lockin-notes/${USER}/photo-a.webp`]);
  });
});

describe("copyGooglePhoto", () => {
  const answer = (type = "image/jpeg") => vi.fn(async () => new Response(new Uint8Array(20), { headers: { "content-type": type } }));

  it("copies Google's photo, asked at 256px, into an account without one", async () => {
    const fetch = answer();
    vi.stubGlobal("fetch", fetch);
    await copyGooglePhoto(USER, "https://lh3.googleusercontent.com/a/abc=s96-c");
    expect(fetch).toHaveBeenCalledWith("https://lh3.googleusercontent.com/a/abc=s256-c", expect.anything());
    expect(image).toMatch(/photo-.+\.jpg$/);
  });

  it("fetches nothing that isn't Google's photo host", async () => {
    const fetch = answer();
    vi.stubGlobal("fetch", fetch);
    for (const url of ["http://lh3.googleusercontent.com/a", "https://evil.test/lh3.googleusercontent.com/", "https://169.254.169.254/", 42]) {
      await copyGooglePhoto(USER, url);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps a photo the account already has, and skips what isn't an image", async () => {
    image = ours("photo-mine.webp");
    vi.stubGlobal("fetch", answer());
    await copyGooglePhoto(USER, "https://lh3.googleusercontent.com/a/abc=s96-c");
    expect(image).toBe(ours("photo-mine.webp"));

    image = null;
    vi.stubGlobal("fetch", answer("text/html"));
    await copyGooglePhoto(USER, "https://lh3.googleusercontent.com/a/abc=s96-c");
    expect(image).toBeNull();
  });
});
