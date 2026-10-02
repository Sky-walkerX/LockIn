import { describe, expect, it } from "vitest";
import { fetchPublicJson, isPublicAddress } from "./public-fetch";

describe("isPublicAddress", () => {
  it("allows public addresses", () => {
    for (const ip of ["160.79.104.10", "8.8.8.8", "2606:4700:4700::1111"]) expect(isPublicAddress(ip)).toBe(true);
  });

  it("refuses this machine, private networks, link-local and reserved ranges", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "255.255.255.255",
      "::1",
      "::",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "not an ip",
    ]) {
      expect(isPublicAddress(ip), ip).toBe(false);
    }
  });
});

describe("fetchPublicJson", () => {
  it("won't connect to a name that resolves to this machine", async () => {
    await expect(fetchPublicJson("https://localhost./meta")).rejects.toThrow(/public address/);
  });

  it("won't use plain http", async () => {
    await expect(fetchPublicJson("http://example.com/meta")).rejects.toThrow(/https only/);
  });
});
