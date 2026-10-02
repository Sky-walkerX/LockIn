import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TOKEN_PREFIX, hashToken, sourceFromTokenName } from "@/lib/tokens";
import { ACCESS_PREFIX, authenticateAccessToken } from "@/lib/oauth/server";

/**
 * Returns the authenticated user's id (JWT `sub`) for an API route, or null.
 * Mirrors the project convention: routes read the NextAuth JWT directly with
 * `getToken` and authorize on `token.sub`.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  return token?.sub ?? null;
}

export type TokenAuth = {
  userId: string;
  tokenId: string;
  source: string;
  /** Over the rate limit: the request should be turned away. */
  limited: boolean;
  /** Seconds until the current window ends, for Retry-After. */
  retryAfter: number;
};

/** MCP requests one token may make per minute. Enough for a busy agent
 *  session; a runaway loop is stopped within the minute. */
export const MCP_REQUESTS_PER_MINUTE = 60;

/**
 * Resolves an MCP bearer token to its user, or null when it's malformed,
 * unknown, expired or revoked, and counts the request against its rate limit.
 * Personal access tokens (lk_pat_) are checked here; OAuth access tokens
 * (lk_oat_, from apps that signed in) by lib/oauth/server.ts the same way.
 *
 * One statement does all of it: find the token, count this request in its
 * one-minute window (starting a new window once the old one has passed), and
 * record when it was last used. It replaces the read every MCP call already
 * made, so the limit costs no extra round trip and needs no other service.
 * Times are UTC, as Prisma stores them.
 */
export async function authenticateToken(bearer: string | undefined): Promise<TokenAuth | null> {
  if (bearer?.startsWith(ACCESS_PREFIX)) return limitedAuth(await authenticateAccessToken(bearer));
  if (!bearer || !bearer.startsWith(TOKEN_PREFIX)) return null;
  const [row] = await prisma.$queryRaw<
    { id: string; userId: string; name: string; windowCount: number; retryAfter: number }[]
  >`
    UPDATE "ApiToken" SET
      "windowCount" = CASE WHEN "windowStart" > (now() AT TIME ZONE 'UTC') - interval '1 minute' THEN "windowCount" + 1 ELSE 1 END,
      "windowStart" = CASE WHEN "windowStart" > (now() AT TIME ZONE 'UTC') - interval '1 minute' THEN "windowStart" ELSE (now() AT TIME ZONE 'UTC') END,
      "lastUsedAt" = (now() AT TIME ZONE 'UTC')
    WHERE "tokenHash" = ${hashToken(bearer)} AND "revokedAt" IS NULL
    RETURNING "id", "userId", "name", "windowCount",
      CEIL(EXTRACT(EPOCH FROM "windowStart" + interval '1 minute' - (now() AT TIME ZONE 'UTC')))::int AS "retryAfter"`;
  return limitedAuth(row ?? null);
}

/** A token's (or an OAuth grant's) row as the MCP route reads it: who it is,
 *  the source stamped on what it saves, and whether it's over the limit. */
function limitedAuth(
  row: { id: string; userId: string; name: string; windowCount: number; retryAfter: number } | null,
): TokenAuth | null {
  if (!row) return null;
  return {
    userId: row.userId,
    tokenId: row.id,
    source: sourceFromTokenName(row.name),
    limited: row.windowCount > MCP_REQUESTS_PER_MINUTE,
    retryAfter: Math.max(1, Number(row.retryAfter)),
  };
}
