import { beforeEach, describe, expect, it, vi } from "vitest";

// The account as the database has it, and what was asked of the database, in order.
let account: { passwordChangedAt: Date | null } | null = null;
const asked: string[] = [];
const tx = {
  $queryRaw: async (sql: TemplateStringsArray) => asked.push(sql.join("?").includes("FOR SHARE") ? "hold" : "other"),
  user: {
    findUnique: async () => {
      asked.push("read");
      return account;
    },
  },
};
vi.mock("@/lib/prisma", () => ({ default: { $transaction: async (run: (t: typeof tx) => unknown) => run(tx) } }));

const { whileSessionStands } = await import("./session");

const mint = vi.fn(async () => {
  asked.push("mint");
  return "token";
});

beforeEach(() => {
  account = { passwordChangedAt: null };
  asked.length = 0;
  mint.mockClear();
});

describe("whileSessionStands", () => {
  it("holds the account, reads it from the database, and only then hands anything out", async () => {
    expect(await whileSessionStands("user-1", { passwordVersion: null, signedInAt: 1_000 }, mint)).toBe("token");
    expect(asked).toEqual(["hold", "read", "mint"]);
  });

  it("hands out nothing once the password is no longer the one the session signed in with", async () => {
    account = { passwordChangedAt: new Date(2_000) };
    expect(await whileSessionStands("user-1", { passwordVersion: null, signedInAt: 1_000 }, mint)).toBeNull();
    expect(await whileSessionStands("user-1", { passwordVersion: 1_500, signedInAt: 1_600 }, mint)).toBeNull();
    expect(mint).not.toHaveBeenCalled();
  });

  it("isn't fooled by a sign-in with the old password that is stamped later than the change", async () => {
    // The change was stamped 2000 and landed a moment after. In between, the
    // old password still worked: this session read it, and the old version with it.
    account = { passwordChangedAt: new Date(2_000) };
    expect(await whileSessionStands("user-1", { passwordVersion: null, signedInAt: 2_050 }, mint)).toBeNull();
    expect(mint).not.toHaveBeenCalled();
  });

  it("hands out to a session that signed in with the new password", async () => {
    account = { passwordChangedAt: new Date(2_000) };
    expect(await whileSessionStands("user-1", { passwordVersion: 2_000, signedInAt: 1_990 }, mint)).toBe("token");
  });

  it("holds a session from before versions were carried to when it signed in", async () => {
    account = { passwordChangedAt: new Date(2_000) };
    expect(await whileSessionStands("user-1", { signedInAt: 1_000 }, mint)).toBeNull();
    expect(await whileSessionStands("user-1", {}, mint)).toBeNull();
    account = { passwordChangedAt: null };
    expect(await whileSessionStands("user-1", {}, mint)).toBe("token");
  });

  it("hands out nothing for an account that is gone", async () => {
    account = null;
    expect(await whileSessionStands("user-1", { passwordVersion: null, signedInAt: 1_000 }, mint)).toBeNull();
    expect(mint).not.toHaveBeenCalled();
  });
});
