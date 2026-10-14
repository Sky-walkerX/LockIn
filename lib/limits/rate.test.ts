import { afterEach, describe, expect, it, vi } from "vitest";

// Counting is one statement against Postgres; here it only notes the key.
const counted: string[] = [];
vi.mock("@/lib/prisma", () => ({
  default: {
    $queryRaw: async (_: TemplateStringsArray, key: string) => {
      counted.push(key);
      return [{ count: 1, retryAfter: 1 }];
    },
    $executeRaw: async () => 0,
  },
}));

const { clientAddress, countPasswordTry, wait } = await import("./rate");

afterEach(() => vi.unstubAllEnvs());

const from = (forwarded?: string) => new Headers(forwarded ? { "x-forwarded-for": forwarded } : {});

describe("clientAddress", () => {
  it("takes what the nearest proxy saw, not what the caller claimed", () => {
    expect(clientAddress(from("203.0.113.7"))).toBe("203.0.113.7");
    // The caller sent "1.1.1.1" themselves; the proxy added the real one after it.
    expect(clientAddress(from("1.1.1.1, 203.0.113.7"))).toBe("203.0.113.7");
  });

  it("counts back past each proxy that stands in front", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    expect(clientAddress(from("6.6.6.6, 203.0.113.7, 10.0.0.2"))).toBe("203.0.113.7");
    // Fewer entries than proxies: the first one is the furthest back there is.
    expect(clientAddress(from("203.0.113.7"))).toBe("203.0.113.7");
  });

  it("has nothing to go on without the header", () => {
    expect(clientAddress(from())).toBe("unknown");
  });

  it("believes none of it when no proxy stands in front", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "0");
    // Reached directly, the caller wrote all of this.
    expect(clientAddress(from("6.6.6.6"))).toBe("unknown");
    expect(clientAddress(from("6.6.6.6, 203.0.113.7"))).toBe("unknown");
  });

  it("reads a setting that isn't a count as one proxy", () => {
    for (const value of ["", " ", "-1", "1.5", "many"]) {
      vi.stubEnv("TRUSTED_PROXY_HOPS", value);
      expect(clientAddress(from("1.1.1.1, 203.0.113.7"))).toBe("203.0.113.7");
    }
  });
});

describe("wait", () => {
  it("says how long in words", () => {
    expect(wait(1)).toBe("1 second");
    expect(wait(40)).toBe("40 seconds");
    expect(wait(600)).toBe("10 minutes");
    expect(wait(601)).toBe("11 minutes");
  });
});

describe("countPasswordTry", () => {
  it("counts an address typed with another's key in it as itself", async () => {
    counted.length = 0;
    await countPasswordTry("ada@example.com", "203.0.113.7");
    const hers = [...counted];
    counted.length = 0;
    // Typed from somewhere else, shaped like her address and her network.
    await countPasswordTry("ada@example.com:203.0.113.7", "198.51.100.9");
    await countPasswordTry("ada@example.com", "198.51.100.9:203.0.113.7");
    expect(counted.filter((key) => hers.includes(key))).toEqual(["login:ada%40example.com"]);
  });
});

