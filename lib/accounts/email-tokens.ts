import { randomBytes } from "node:crypto";
import prisma from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

// The one-time links LockIn emails: one to confirm an address, one to set a
// new password. Like agent tokens, only a link's sha256 is stored, so the
// database never holds anything that could be used.

export type EmailPurpose = "verify" | "reset";

const PREFIX: Record<EmailPurpose, string> = { verify: "lk_ev_", reset: "lk_pr_" };
const TTL_MS: Record<EmailPurpose, number> = { verify: 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 };

/** How long before another link can be sent to the same account. */
export const RESEND_AFTER_MS = 60 * 1000;

/**
 * A new link's token for this account, or null when one was sent within the
 * last minute (so a form can't be used to flood someone's inbox). Links this
 * account no longer needs are cleared out as it goes.
 */
export async function issueEmailToken(userId: string, purpose: EmailPurpose): Promise<string | null> {
  const now = Date.now();
  const latest = await prisma.emailToken.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest && now - latest.createdAt.getTime() < RESEND_AFTER_MS) return null;

  const token = `${PREFIX[purpose]}${randomBytes(32).toString("base64url")}`;
  await prisma.$transaction([
    // One live link per purpose: asking again retires the earlier one.
    prisma.emailToken.deleteMany({ where: { userId, purpose } }),
    prisma.emailToken.create({
      data: { tokenHash: hashToken(token), purpose, userId, expiresAt: new Date(now + TTL_MS[purpose]) },
    }),
  ]);
  return token;
}

/** Whether a link would still work, without spending it. */
export async function emailTokenStands(token: string, purpose: EmailPurpose): Promise<boolean> {
  if (!token.startsWith(PREFIX[purpose])) return false;
  const row = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return !!row && row.purpose === purpose && !row.usedAt && row.expiresAt > new Date();
}

/**
 * Spends a link and returns whose it was, or null when it's unknown, expired
 * or already used. Of two requests with the same link, only one gets the row.
 */
export async function redeemEmailToken(token: string, purpose: EmailPurpose): Promise<string | null> {
  if (!token.startsWith(PREFIX[purpose])) return null;
  const tokenHash = hashToken(token);
  const now = new Date();
  const spent = await prisma.emailToken.updateMany({
    where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  });
  if (spent.count === 0) return null;
  const row = await prisma.emailToken.findUnique({ where: { tokenHash }, select: { userId: true } });
  return row?.userId ?? null;
}
