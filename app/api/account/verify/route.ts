import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { emailTokenOwner, emailTokenStands, redeemEmailToken } from "@/lib/accounts/email-tokens";
import { PASSWORD_MAX } from "@/lib/accounts/policy";
import { hashToken } from "@/lib/tokens";
import { countAgainst, tooMany } from "@/lib/limits/rate";

const Body = z.object({ token: z.string().min(1).max(200), password: z.string().min(1).max(PASSWORD_MAX) });

const INVALID = { error: "This link is no longer valid. Sign in to have a new one sent." };

// GET /api/account/verify?token= - whether a confirmation link would still
// work. Spends nothing.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return Response.json({ valid: await emailTokenStands(token, "verify") }, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/account/verify { token, password } - confirm the address.
//
// It takes the account's password as well as the link. The link shows that
// whoever holds it reads the inbox; the password shows they're the one who
// made the account. Without it, someone could sign up with another person's
// address and a password of their own, and the owner pressing "confirm" on an
// email they didn't expect would hand over a confirmed account the stranger
// can sign in to. It also means a mail scanner opening the link confirms nothing.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json(INVALID, { status: 400 });
  const { token, password } = parsed.data;

  // A handful of tries per link: the link's holder shouldn't get to guess the password.
  const limit = await countAgainst(`verify:${hashToken(token)}`, 10, 60 * 60);
  if (!limit.ok) return tooMany(limit, "Too many tries");

  const userId = await emailTokenOwner(token, "verify");
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { email: true, password: true } }) : null;
  if (!user?.password) return Response.json(INVALID, { status: 400 });
  if (!(await bcrypt.compare(password, user.password))) {
    return Response.json({ error: "That isn't the password this account was made with." }, { status: 403 });
  }

  // Spent only now, so a wrong password doesn't use the link up.
  if (!(await redeemEmailToken(token, "verify"))) return Response.json(INVALID, { status: 400 });
  await prisma.user.update({ where: { id: userId! }, data: { emailVerifiedAt: new Date() } });
  return Response.json({ email: user.email });
}
