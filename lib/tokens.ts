import { createHash, randomBytes } from "node:crypto";

// Personal access tokens for the MCP server. The fixed prefix lets secret
// scanners (GitHub's, gitleaks) recognise a leaked token; the 32 random bytes
// are the secret. Only the sha256 is ever stored.
export const TOKEN_PREFIX = "lk_pat_";

export function generateToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Enough of the token to tell two apart in a list, never enough to use. */
export function tokenPreview(token: string): string {
  return `${token.slice(0, TOKEN_PREFIX.length + 4)}…`;
}

/** A token's name as a note source: "Claude Code" -> "claude-code". */
export function sourceFromTokenName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return slug || "agent";
}
