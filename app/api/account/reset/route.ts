import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { emailTokenStands, redeemEmailToken } from "@/lib/accounts/email-tokens";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/accounts/policy";
import { forgetAccount } from "@/lib/accounts/session";
import { disconnectEverything } from "@/lib/connections";

const Body = z.object({
  token: z.string().min(1).max(200),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
});

const INVALID = { error: "This link is no longer valid. Ask for a new one." };

// GET /api/account/reset?token= - whether a reset link would still work, so
// the page can say so before anyone types a password. Spends nothing.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return Response.json({ valid: await emailTokenStands(token, "reset") }, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/account/reset { token, password } - set a new password from an
// emailed link. Every session from before stops working, every agent and
// connected app is cut off (`disconnected` says how many), and the address
// counts as confirmed: the link could only have been read in its inbox.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const password = parsed.error.issues.find((i) => i.path[0] === "password");
    return Response.json(password ? { error: password.message } : INVALID, { status: 400 });
  }

  const userId = await redeemEmailToken(parsed.data.token, "reset");
  if (!userId) return Response.json(INVALID, { status: 400 });

  const now = new Date();
  const [user, tokens, apps] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(parsed.data.password, 10), passwordChangedAt: now, emailVerifiedAt: now },
      select: { email: true },
    }),
    ...disconnectEverything(userId, now),
    // Any other reset link still out for this account is dead too.
    prisma.emailToken.deleteMany({ where: { userId, purpose: "reset" } }),
  ]);
  forgetAccount(userId);
  return Response.json({ email: user.email, disconnected: tokens.count + apps.count });
}
