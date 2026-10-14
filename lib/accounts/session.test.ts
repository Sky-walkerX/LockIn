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
    expect(await whileSessionStands("user-1", 1_000, mint)).toBe("token");
    expect(asked).toEqual(["hold", "read", "mint"]);
  });

  it("hands out nothing to a session from before the password was set", async () => {
    account = { passwordChangedAt: new Date(2_000) };
    expect(await whileSessionStands("user-1", 1_000, mint)).toBeNull();
    expect(await whileSessionStands("user-1", undefined, mint)).toBeNull();
    expect(mint).not.toHaveBeenCalled();
  });

  it("hands out to a session that signed in with the new password", async () => {
    account = { passwordChangedAt: new Date(2_000) };
    expect(await whileSessionStands("user-1", 2_000, mint)).toBe("token");
    expect(await whileSessionStands("user-1", 3_000, mint)).toBe("token");
  });

  it("hands out nothing for an account that is gone", async () => {
    account = null;
    expect(await whileSessionStands("user-1", 1_000, mint)).toBeNull();
    expect(mint).not.toHaveBeenCalled();
  });
});
