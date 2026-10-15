import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  cleanClientName,
  impersonates,
  isAcceptableRedirectUri,
  isFetchableHost,
  isMetadataDocumentId,
  parseClientMetadata,
  pkceMatches,
  redirectMatches,
} from "./rules";

describe("isAcceptableRedirectUri", () => {
  it("accepts https and loopback http", () => {
    expect(isAcceptableRedirectUri("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(isAcceptableRedirectUri("http://localhost/callback")).toBe(true);
    expect(isAcceptableRedirectUri("http://127.0.0.1:3118/callback")).toBe(true);
  });

  it("refuses plain http elsewhere, fragments and junk", () => {
    expect(isAcceptableRedirectUri("http://evil.example/cb")).toBe(false);
    expect(isAcceptableRedirectUri("https://claude.ai/cb#x")).toBe(false);
    expect(isAcceptableRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isAcceptableRedirectUri("not a url")).toBe(false);
  });
});

describe("redirectMatches", () => {
  const registered = ["https://claude.ai/api/mcp/auth_callback", "http://localhost/callback", "http://127.0.0.1/callback"];

  it("matches a registered URI exactly", () => {
    expect(redirectMatches(registered, "https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(redirectMatches(registered, "https://claude.ai/api/mcp/auth_callback?x=1")).toBe(false);
    expect(redirectMatches(registered, "https://claude.ai.evil.com/api/mcp/auth_callback")).toBe(false);
  });

  it("lets a loopback URI pick any port, but not another path or host", () => {
    expect(redirectMatches(registered, "http://localhost:3118/callback")).toBe(true);
    expect(redirectMatches(registered, "http://127.0.0.1:54012/callback")).toBe(true);
    expect(redirectMatches(registered, "http://localhost:3118/other")).toBe(false);
    expect(redirectMatches(["http://127.0.0.1/callback"], "http://localhost:3118/callback")).toBe(false);
  });
});

describe("pkceMatches", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  it("accepts the verifier behind the challenge", () => {
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(pkceMatches(verifier, challenge)).toBe(true);
  });

  it("refuses another verifier, or one too short to be one", () => {
    expect(pkceMatches(verifier.replace("d", "e"), challenge)).toBe(false);
    expect(pkceMatches("short", createHash("sha256").update("short").digest("base64url"))).toBe(false);
  });
});

describe("client metadata documents", () => {
  const url = "https://claude.ai/oauth/claude-code-client-metadata";

  it("recognises URL client ids", () => {
    expect(isMetadataDocumentId(url)).toBe(true);
    expect(isMetadataDocumentId("3f2b9c1e-uuid-like")).toBe(false);
    expect(isMetadataDocumentId("http://example.com/meta")).toBe(false);
  });

  it("only fetches from public hosts", () => {
    expect(isFetchableHost("claude.ai")).toBe(true);
    expect(isFetchableHost("localhost")).toBe(false);
    expect(isFetchableHost("169.254.169.254")).toBe(false);
    expect(isFetchableHost("db.internal")).toBe(false);
    expect(isFetchableHost("intranet")).toBe(false);
    expect(isFetchableHost("localhost.")).toBe(false);
    expect(isFetchableHost("127.0.0.1.")).toBe(false);
    expect(isFetchableHost("metadata.google.internal.")).toBe(false);
  });

  it("reads a document whose client_id is its own URL", () => {
    const doc = { client_id: url, client_name: "Claude Code", redirect_uris: ["http://localhost/callback", "http://127.0.0.1/callback"] };
    expect(parseClientMetadata(url, doc)).toEqual({ name: "Claude Code", redirectUris: doc.redirect_uris });
  });

  it("refuses a document claiming another id, or with redirects it can't have", () => {
    expect(parseClientMetadata(url, { client_id: "https://other.example/meta", redirect_uris: ["https://x.example/cb"] })).toBeNull();
    expect(parseClientMetadata(url, { client_id: url, redirect_uris: ["http://evil.example/cb"] })).toBeNull();
    expect(parseClientMetadata(url, { client_id: url, redirect_uris: [] })).toBeNull();
  });

  it("names a client after its host when it gives no name", () => {
    expect(parseClientMetadata(url, { client_id: url, redirect_uris: ["https://claude.ai/cb"] })?.name).toBe("claude.ai");
  });
});

describe("impersonates", () => {
  const own = "lockin.example.com";
  it("flags a well-known name on someone else's domain", () => {
    expect(impersonates("Claude", "evil.example", own)).toBe("Claude");
    expect(impersonates("ChatGPT Connector", "chatgpt.com.evil.example", own)).toBe("ChatGPT");
    expect(impersonates("LockIn Desktop", "evil.example", own)).toBe("LockIn");
  });
  it("lets the real apps through, subdomains included", () => {
    expect(impersonates("Claude", "claude.ai", own)).toBeNull();
    expect(impersonates("ChatGPT", "chatgpt.com", own)).toBeNull();
    expect(impersonates("Cursor", "www.cursor.com", own)).toBeNull();
    expect(impersonates("LockIn", own, own)).toBeNull();
  });
  it("sees through look-alike and invisible characters", () => {
    expect(impersonates("Cl\u200Baude", "evil.example", own)).toBe("Claude");
    expect(impersonates("\u0421laude", "evil.example", own)).toBe("Claude"); // Cyrillic С
    expect(impersonates("ｃｌａｕｄｅ", "evil.example", own)).toBe("Claude"); // full-width
    expect(impersonates("C-l-a-u-d-e", "evil.example", own)).toBe("Claude");
    expect(impersonates("Chat GPT", "evil.example", own)).toBe("ChatGPT");
    expect(impersonates("Lock In", "evil.example", own)).toBe("LockIn");
  });
  it("trusts only exact hosts where a platform serves other people's pages", () => {
    expect(impersonates("Gemini", "gemini.google.com", own)).toBeNull();
    expect(impersonates("Gemini", "script.google.com", own)).toBe("Gemini");
    expect(impersonates("GitHub Copilot", "github.com", own)).toBeNull();
    expect(impersonates("GitHub Copilot", "someone.github.io", own)).toBe("GitHub Copilot");
  });
  it("leaves names that claim nothing, and apps on this computer, alone", () => {
    expect(impersonates("My notes script", "evil.example", own)).toBeNull();
    expect(impersonates("Claude Code", "localhost", own)).toBeNull();
    expect(impersonates("Claude Code", "127.0.0.1", own)).toBeNull();
  });
});

describe("cleanClientName", () => {
  it("drops invisible and control characters and keeps the rest", () => {
    expect(cleanClientName("Cl\u200Baude\u202E")).toBe("Claude");
    expect(cleanClientName("  My   app\n")).toBe("My app");
    expect(cleanClientName("\u200B")).toBeNull();
    expect(cleanClientName(42)).toBeNull();
  });
});
