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

/**
 * A client's self-chosen name as it may be stored and shown: control and
 * invisible formatting characters (zero-width spaces, right-to-left marks)
 * removed, spaces collapsed, 80 characters at most. Null when nothing is left.
 */
export function cleanClientName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/[\p{Cc}\p{Cf}]/gu, "").replace(/\s+/g, " ").trim().slice(0, 80);
  return name || null;
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
  const name = cleanClientName(d.client_name) ?? new URL(url).hostname;
  return { name, redirectUris };
}

// Apps people already trust, and where they really sign in from. A client
// that names itself after one of these but sends people somewhere else is the
// consent-phishing case: the consent page warns about it. `domains` covers a
// domain and its subdomains; `hosts` is exact, for platforms that also serve
// other people's pages under their domain (script.google.com, *.github.io).
const KNOWN_APPS: { name: string; match: RegExp; domains: string[]; hosts?: string[] }[] = [
  { name: "Claude", match: /claude|anthropic/, domains: ["claude.ai", "claude.com", "anthropic.com"] },
  { name: "ChatGPT", match: /chatgpt|openai|codex/, domains: ["chatgpt.com", "openai.com"] },
  { name: "Cursor", match: /cursor/, domains: ["cursor.com", "cursor.sh"] },
  { name: "Gemini", match: /gemini|google/, domains: [], hosts: ["gemini.google.com"] },
  { name: "GitHub Copilot", match: /copilot|github/, domains: ["githubcopilot.com"], hosts: ["github.com"] },
  { name: "LockIn", match: /lockin/, domains: [] },
];

// Letters from other scripts that look like Latin ones, so "Сlaude" (a
// Cyrillic С) reads as the name it imitates.
const LOOKALIKES: Record<string, string> = {
  а: "a", в: "b", е: "e", к: "k", м: "m", н: "h", о: "o", р: "p", с: "c", т: "t", у: "y", х: "x", і: "i", ј: "j", ѕ: "s", ԁ: "d", ӏ: "l",
  α: "a", β: "b", ε: "e", η: "n", ι: "i", κ: "k", ν: "v", ο: "o", ρ: "p", τ: "t", υ: "u", χ: "x",
  "0": "o", "1": "l", "3": "e", "5": "s", "@": "a", "$": "s",
};

/**
 * A name reduced to what it looks like, for matching only: compatibility
 * forms folded (ｃｌａｕｄｅ), accents and invisible characters dropped,
 * look-alike letters mapped to Latin, and everything but letters removed, so
 * "C l a u d e", "Cl\u200Baude" and "Сlaude" all read "claude". Pure.
 */
export function nameSkeleton(name: string): string {
  return [...name.normalize("NFKD").toLowerCase()]
    .map((ch) => LOOKALIKES[ch] ?? ch)
    .join("")
    .replace(/[^a-z]/g, "");
}

const onDomain = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

/**
 * The well-known app a client's self-chosen name claims to be, when the place
 * it sends people back to (`host`) isn't that app's. Null when the name claims
 * nothing, or the host fits. An app on this computer (a loopback redirect) is
 * never flagged: the consent page already says it's local, and a local app is
 * one the user started. `ownHost` is this instance, for "LockIn".
 */
export function impersonates(name: string, host: string, ownHost: string): string | null {
  const h = host.toLowerCase().replace(/\.+$/, "");
  if (LOOPBACK.has(h)) return null;
  const skeleton = nameSkeleton(name);
  for (const app of KNOWN_APPS) {
    if (!app.match.test(skeleton)) continue;
    const hosts = app.name === "LockIn" ? [ownHost.toLowerCase()] : (app.hosts ?? []);
    if (!hosts.includes(h) && !app.domains.some((d) => onDomain(h, d))) return app.name;
  }
  return null;
}
