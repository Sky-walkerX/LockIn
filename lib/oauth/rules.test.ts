import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
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
