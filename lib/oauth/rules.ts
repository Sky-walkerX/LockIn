import { createHash } from "node:crypto";

/**
 * The checks LockIn's OAuth server makes on what a client sends, kept pure so
 * they're tested without a database: which redirect URIs are acceptable and
 * match, PKCE, and what a Client ID Metadata Document must say.
 */

export const SCOPE = "notebook";
export const ACCESS_TTL_SECONDS = 60 * 60;
export const REFRESH_TTL_SECONDS = 60 * 24 * 60 * 60;
export const CODE_TTL_SECONDS = 10 * 60;

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

function parse(uri: string): URL | null {
  try {
    return new URL(uri);
  } catch {
    return null;
  }
}

/** Where a client may send people back to: https, or http on this machine
 *  (a native app like Claude Code listening on a loopback port). */
export function isAcceptableRedirectUri(uri: string): boolean {
  const url = parse(uri);
  if (!url || url.hash) return false;
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOOPBACK.has(url.hostname);
}

/**
 * Whether a requested redirect URI is one the client registered. Exact match,
 * except that a loopback URI matches whatever port it asks for (RFC 8252 §7.3):
 * a native client picks a free port each time it signs in.
 */
export function redirectMatches(registered: string[], requested: string): boolean {
  if (registered.includes(requested)) return true;
  const want = parse(requested);
  if (!want || want.protocol !== "http:" || !LOOPBACK.has(want.hostname)) return false;
  return registered.some((r) => {
    const have = parse(r);
    return (
      !!have &&
      have.protocol === "http:" &&
      have.hostname === want.hostname &&
      have.pathname === want.pathname &&
      have.search === want.search
    );
  });
}

/** RFC 7636 S256: the challenge is the base64url sha256 of the verifier. */
export function pkceMatches(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  return createHash("sha256").update(verifier).digest("base64url") === challenge;
}

/** Client ids that are URLs are Client ID Metadata Documents. */
export function isMetadataDocumentId(clientId: string): boolean {
  const url = parse(clientId);
  return !!url && url.protocol === "https:" && url.pathname !== "/";
}

/**
 * A host a metadata document may be fetched from: a public name, never an IP
 * literal or a name for this machine or its network. A quick first check on
 * the name only; `public-fetch.ts` checks the addresses it actually resolves
 * to, which is what keeps a client id from reaching the server's own network.
 */
export function isFetchableHost(hostname: string): boolean {
  // "localhost." is localhost: a trailing dot only makes a name absolute.
  const h = hostname.toLowerCase().replace(/\.+$/, "");
  if (LOOPBACK.has(h) || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.startsWith("[")) return false;
  return h.includes(".");
}

export type ClientMetadata = { name: string; redirectUris: string[] };

/**
 * Reads a Client ID Metadata Document: its `client_id` must be the URL it was
 * fetched from, and it must list redirect URIs this server accepts. Null when
 * it doesn't hold up.
 */
export function parseClientMetadata(url: string, doc: unknown): ClientMetadata | null {
  if (!doc || typeof doc !== "object") return null;
  const d = doc as { client_id?: unknown; client_name?: unknown; redirect_uris?: unknown };
  if (d.client_id !== url) return null;
  if (!Array.isArray(d.redirect_uris) || d.redirect_uris.length === 0) return null;
  const redirectUris = d.redirect_uris.filter((u): u is string => typeof u === "string");
  if (redirectUris.length !== d.redirect_uris.length || !redirectUris.every(isAcceptableRedirectUri)) return null;
  const name = typeof d.client_name === "string" && d.client_name.trim() ? d.client_name.trim().slice(0, 80) : new URL(url).hostname;
  return { name, redirectUris };
}
