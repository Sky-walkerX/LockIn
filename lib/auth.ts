import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TOKEN_PREFIX, hashToken, sourceFromTokenName } from "@/lib/tokens";

/**
 * Returns the authenticated user's id (JWT `sub`) for an API route, or null.
 * Mirrors the project convention: routes read the NextAuth JWT directly with
 * `getToken` and authorize on `token.sub`.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  return token?.sub ?? null;
}

export type TokenAuth = { userId: string; tokenId: string; source: string };

// lastUsedAt is for the user's eyes ("used 3 minutes ago"), not an audit log,
// so it's only written when it has gone stale. Writing it on every MCP call
// would add a round trip to each one for no visible difference.
const TOUCH_AFTER_MS = 10 * 60 * 1000;

/**
 * Resolves a personal access token (the MCP server's bearer token) to its user,
 * or null when it's malformed, unknown or revoked.
 */
export async function authenticateToken(bearer: string | undefined): Promise<TokenAuth | null> {
  if (!bearer || !bearer.startsWith(TOKEN_PREFIX)) return null;
  const row = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(bearer) },
    select: { id: true, userId: true, name: true, revokedAt: true, lastUsedAt: true },
  });
  if (!row || row.revokedAt) return null;

  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > TOUCH_AFTER_MS) {
    // Not awaited: a failed touch must never fail the agent's request.
    prisma.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return { userId: row.userId, tokenId: row.id, source: sourceFromTokenName(row.name) };
}
