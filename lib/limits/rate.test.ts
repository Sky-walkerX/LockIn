import { afterEach, describe, expect, it, vi } from "vitest";
import { clientAddress, wait } from "./rate";

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
});

describe("wait", () => {
  it("says how long in words", () => {
    expect(wait(1)).toBe("1 second");
    expect(wait(40)).toBe("40 seconds");
    expect(wait(600)).toBe("10 minutes");
    expect(wait(601)).toBe("11 minutes");
  });
});
