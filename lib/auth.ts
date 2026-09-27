import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Returns the authenticated user's id (JWT `sub`) for an API route, or null.
 * Mirrors the project convention: routes read the NextAuth JWT directly with
 * `getToken` and authorize on `token.sub`.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  return token?.sub ?? null;
}
