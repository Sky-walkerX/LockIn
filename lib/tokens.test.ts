import { describe, expect, it } from "vitest";
import { TOKEN_PREFIX, generateToken, hashToken, sourceFromTokenName, tokenPreview } from "./tokens";

describe("tokens", () => {
  it("generates prefixed, unguessable, distinct tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(a.length).toBeGreaterThan(TOKEN_PREFIX.length + 40);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically and never returns the token", () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t.slice(TOKEN_PREFIX.length));
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("previews only the prefix and four characters", () => {
    const t = `${TOKEN_PREFIX}abcdefghijkl`;
    expect(tokenPreview(t)).toBe(`${TOKEN_PREFIX}abcd…`);
  });

  it("turns a token name into a note source", () => {
    expect(sourceFromTokenName("Claude Code")).toBe("claude-code");
    expect(sourceFromTokenName("  Codex (work laptop) ")).toBe("codex-work-laptop");
    expect(sourceFromTokenName("Café agent")).toBe("cafe-agent");
    expect(sourceFromTokenName("!!!")).toBe("agent");
  });
});
