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
