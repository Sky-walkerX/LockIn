import { randomBytes, randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { fetchPublicJson } from "./public-fetch";
import {
  ACCESS_TTL_SECONDS,
  CODE_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  SCOPE,
  isAcceptableRedirectUri,
  isFetchableHost,
  isMetadataDocumentId,
  parseClientMetadata,
  pkceMatches,
  redirectMatches,
} from "./rules";

/**
 * LockIn as an OAuth 2.1 authorization server for MCP clients that sign in
 * (Claude.ai, ChatGPT, Claude Code), per the MCP authorization spec: clients
 * are known by a Client ID Metadata Document or registered dynamically, every
 * code is bound to a PKCE challenge, and tokens are opaque and stored hashed.
 */

export const ACCESS_PREFIX = "lk_oat_";
const REFRESH_PREFIX = "lk_ort_";
const CODE_PREFIX = "lk_oac_";

const secret = (prefix: string) => `${prefix}${randomBytes(32).toString("base64url")}`;
const later = (seconds: number) => new Date(Date.now() + seconds * 1000);

/** The issuer and the protected resource, both derived from the public origin. */
export function issuerFor(origin: string): string {
  return origin;
}
export function resourceFor(origin: string): string {
  return `${origin}/api/mcp`;
}

export type Client = { id: string; name: string; redirectUris: string[] };

// A metadata document is re-read after a day, so a client that changes its
// redirect URIs isn't stuck with the old ones.
const METADATA_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function fetchMetadata(url: string): Promise<ReturnType<typeof parseClientMetadata>> {
  if (!isFetchableHost(new URL(url).hostname)) return null;
  try {
    return parseClientMetadata(url, await fetchPublicJson(url));
  } catch {
    return null;
  }
}

/** The client behind a client_id, fetching (or re-fetching) its metadata
 *  document when the id is a URL. Null for an unknown or invalid client. */
export async function findClient(clientId: string): Promise<Client | null> {
  const stored = await prisma.oAuthClient.findUnique({ where: { id: clientId } });
  if (!isMetadataDocumentId(clientId)) return stored;

  if (stored?.fetchedAt && Date.now() - stored.fetchedAt.getTime() < METADATA_MAX_AGE_MS) return stored;
  const meta = await fetchMetadata(clientId);
  if (!meta) return null;
  return prisma.oAuthClient.upsert({
    where: { id: clientId },
    create: { id: clientId, name: meta.name, redirectUris: meta.redirectUris, kind: "cimd", fetchedAt: new Date() },
    update: { name: meta.name, redirectUris: meta.redirectUris, fetchedAt: new Date() },
  });
}

/** Dynamic Client Registration (RFC 7591), for public clients only. */
export async function registerClient(body: unknown): Promise<{ ok: true; client: Client } | { ok: false; error: string }> {
  const b = (body ?? {}) as { redirect_uris?: unknown; client_name?: unknown; token_endpoint_auth_method?: unknown };
  const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris : [];
  if (uris.length === 0 || uris.length > 10 || !uris.every((u) => typeof u === "string" && isAcceptableRedirectUri(u))) {
    return { ok: false, error: "redirect_uris must list https URLs, or http URLs on localhost" };
  }
  if (b.token_endpoint_auth_method !== undefined && b.token_endpoint_auth_method !== "none") {
    return { ok: false, error: "Only public clients (token_endpoint_auth_method none) can register" };
  }
  const name = typeof b.client_name === "string" && b.client_name.trim() ? b.client_name.trim().slice(0, 80) : "MCP client";
  const client = await prisma.oAuthClient.create({
    data: { id: randomUUID(), name, redirectUris: uris as string[], kind: "dcr" },
  });
  return { ok: true, client };
}

export { redirectMatches };

/** A one-time code for an approved request, bound to its PKCE challenge. */
export async function createCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  resource: string | null;
}): Promise<string> {
  const code = secret(CODE_PREFIX);
  await prisma.oAuthCode.create({
    data: { ...input, codeHash: hashToken(code), scope: SCOPE, expiresAt: later(CODE_TTL_SECONDS) },
  });
  return code;
}

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export type TokenError = { error: "invalid_grant" | "invalid_request" | "invalid_client" | "invalid_target"; error_description: string };

async function issue(grantId: string): Promise<TokenResponse> {
  const access = secret(ACCESS_PREFIX);
  const refresh = secret(REFRESH_PREFIX);
  await prisma.oAuthToken.createMany({
    data: [
      { tokenHash: hashToken(access), kind: "access", grantId, expiresAt: later(ACCESS_TTL_SECONDS) },
      { tokenHash: hashToken(refresh), kind: "refresh", grantId, expiresAt: later(REFRESH_TTL_SECONDS) },
    ],
  });
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_SECONDS, refresh_token: refresh, scope: SCOPE };
}

const bad = (error: TokenError["error"], error_description: string): TokenError => ({ error, error_description });

/** authorization_code: spend the code (once), check PKCE, start a grant. */
export async function exchangeCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
  resource: string | null;
}): Promise<TokenResponse | TokenError> {
  const row = await prisma.oAuthCode.findUnique({ where: { codeHash: hashToken(input.code) }, include: { client: true } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return bad("invalid_grant", "The code is unknown, used or expired");
  if (row.clientId !== input.clientId) return bad("invalid_grant", "The code was issued to another client");
  if (row.redirectUri !== input.redirectUri) return bad("invalid_grant", "redirect_uri doesn't match the authorization request");
  if (!pkceMatches(input.codeVerifier, row.codeChallenge)) return bad("invalid_grant", "code_verifier doesn't match the challenge");
  if (input.resource && row.resource && input.resource !== row.resource) return bad("invalid_target", "resource doesn't match");

  // Spend it atomically: of two racing exchanges, only one gets the row.
  const spent = await prisma.oAuthCode.updateMany({ where: { codeHash: row.codeHash, usedAt: null }, data: { usedAt: new Date() } });
  if (spent.count === 0) return bad("invalid_grant", "The code was already used");

  const grant = await prisma.oAuthGrant.create({
    data: { userId: row.userId, clientId: row.clientId, name: row.client.name, scope: row.scope },
  });
  return issue(grant.id);
}

/**
 * refresh_token: rotate. The old refresh token is spent and a new pair issued.
 * A refresh token presented twice was copied somewhere, so the whole grant is
 * revoked and the app has to be connected again.
 */
export async function refreshTokens(refreshToken: string, clientId: string): Promise<TokenResponse | TokenError> {
  const row = await prisma.oAuthToken.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { grant: true } });
  if (!row || row.kind !== "refresh" || row.grant.revokedAt) return bad("invalid_grant", "The refresh token is unknown or revoked");
  if (row.grant.clientId !== clientId) return bad("invalid_grant", "The refresh token was issued to another client");
  if (row.usedAt) {
    await prisma.oAuthGrant.update({ where: { id: row.grantId }, data: { revokedAt: new Date() } });
    return bad("invalid_grant", "The refresh token was already used; the connection has been revoked");
  }
  if (row.expiresAt < new Date()) return bad("invalid_grant", "The refresh token has expired");

  const spent = await prisma.oAuthToken.updateMany({ where: { tokenHash: row.tokenHash, usedAt: null }, data: { usedAt: new Date() } });
  if (spent.count === 0) return bad("invalid_grant", "The refresh token was already used");
  return issue(row.grantId);
}

/** RFC 7009: revoking either token ends the grant. Unknown tokens are fine. */
export async function revokeToken(token: string): Promise<void> {
  const row = await prisma.oAuthToken.findUnique({ where: { tokenHash: hashToken(token) }, select: { grantId: true } });
  if (row) await prisma.oAuthGrant.update({ where: { id: row.grantId }, data: { revokedAt: new Date() } });
}

/**
 * An OAuth access token on an MCP call: the grant behind it, counted against
 * the grant's per-minute limit, in one statement, exactly like a personal
 * access token (lib/auth.ts). Null when unknown, expired or revoked.
 */
export async function authenticateAccessToken(bearer: string) {
  const [row] = await prisma.$queryRaw<
    { id: string; userId: string; name: string; windowCount: number; retryAfter: number }[]
  >`
    UPDATE "OAuthGrant" g SET
      "windowCount" = CASE WHEN g."windowStart" > (now() AT TIME ZONE 'UTC') - interval '1 minute' THEN g."windowCount" + 1 ELSE 1 END,
      "windowStart" = CASE WHEN g."windowStart" > (now() AT TIME ZONE 'UTC') - interval '1 minute' THEN g."windowStart" ELSE (now() AT TIME ZONE 'UTC') END,
      "lastUsedAt" = (now() AT TIME ZONE 'UTC')
    FROM "OAuthToken" t
    WHERE t."tokenHash" = ${hashToken(bearer)} AND t."kind" = 'access'
      AND t."expiresAt" > (now() AT TIME ZONE 'UTC') AND t."grantId" = g."id" AND g."revokedAt" IS NULL
    RETURNING g."id", g."userId", g."name", g."windowCount",
      CEIL(EXTRACT(EPOCH FROM g."windowStart" + interval '1 minute' - (now() AT TIME ZONE 'UTC')))::int AS "retryAfter"`;
  return row ?? null;
}
