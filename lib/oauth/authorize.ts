import { findClient, redirectMatches, resourceFor, type Client } from "./server";

/**
 * Checks an authorization request (the query string of /oauth/authorize), for
 * the consent page and again when the user decides, so nothing the page showed
 * can be swapped before the code is issued.
 *
 * Two kinds of failure, per OAuth: while the client or its redirect URI is in
 * doubt, the error is shown here and nobody is redirected anywhere; once both
 * check out, other errors go back to the client.
 */

export type AuthorizeParams = Partial<
  Record<"response_type" | "client_id" | "redirect_uri" | "code_challenge" | "code_challenge_method" | "state" | "scope" | "resource", string>
>;

export type AuthorizeCheck =
  | { kind: "show-error"; message: string }
  | { kind: "redirect"; url: string }
  | { kind: "ok"; client: Client; redirectUri: string; codeChallenge: string; state: string | null; resource: string | null };

/** The client's redirect URI with OAuth's response parameters, including the
 *  issuer (RFC 9207) so the client can tell which server answered. */
export function responseUrl(redirectUri: string, params: Record<string, string | null>): string {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  return url.toString();
}

export function readParams(search: Record<string, string | string[] | undefined>): AuthorizeParams {
  const out: AuthorizeParams = {};
  for (const key of ["response_type", "client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"] as const) {
    const v = search[key];
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

export async function checkAuthorizeRequest(p: AuthorizeParams, origin: string): Promise<AuthorizeCheck> {
  if (!p.client_id) return { kind: "show-error", message: "The app didn't say who it is (no client_id)." };
  const client = await findClient(p.client_id);
  if (!client) return { kind: "show-error", message: "LockIn doesn't recognise this app, or couldn't read its details." };

  const redirectUri = p.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : undefined);
  if (!redirectUri || !redirectMatches(client.redirectUris, redirectUri)) {
    return { kind: "show-error", message: "The app asked to send you somewhere it never registered, so LockIn stopped here." };
  }

  const state = p.state ?? null;
  const fail = (error: string, description: string): AuthorizeCheck => ({
    kind: "redirect",
    url: responseUrl(redirectUri, { error, error_description: description, state, iss: origin }),
  });

  if (p.response_type !== "code") return fail("unsupported_response_type", "Only the authorization code flow is supported");
  if (!p.code_challenge || p.code_challenge_method !== "S256") return fail("invalid_request", "PKCE with S256 is required");
  const resource = p.resource ? p.resource.replace(/\/$/, "") : null;
  if (resource && resource !== resourceFor(origin)) return fail("invalid_target", "This server only grants access to its MCP endpoint");

  return { kind: "ok", client, redirectUri, codeChallenge: p.code_challenge, state, resource };
}
