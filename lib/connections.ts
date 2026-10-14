import prisma from "@/lib/prisma";

// What Settings may show of an agent token: never the secret or its hash.
export const TOKEN_PUBLIC_FIELDS = { id: true, name: true, preview: true, createdAt: true, lastUsedAt: true, revokedAt: true } as const;

// The user's agent tokens, newest first.
export function listTokens(userId: string) {
  return prisma.apiToken.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: TOKEN_PUBLIC_FIELDS,
  });
}

// Apps connected by signing in (OAuth), newest first; disconnected ones drop out.
export function listConnectedApps(userId: string) {
  return prisma.oAuthGrant.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true },
  });
}

/**
 * Cuts off every agent and app that could reach this notebook: tokens and
 * connected apps are revoked, and a sign-in an app had started can't be
 * finished. Returns the writes, to go in one transaction after the write that
 * sets the password: that one waits for anything being handed out at the same
 * moment (holdAccount, lib/accounts/session.ts), and these then see it and
 * revoke it. The first two say how many they revoked.
 *
 * It goes with a password set from outside the account: an emailed reset link,
 * or the operator's script. That's what the owner does after someone else got
 * in, and a token that person made would outlast the new password.
 */
export function disconnectEverything(userId: string, at: Date) {
  return [
    prisma.apiToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: at } }),
    prisma.oAuthGrant.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: at } }),
    prisma.oAuthCode.deleteMany({ where: { userId } }),
  ] as const;
}
