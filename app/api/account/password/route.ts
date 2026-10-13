import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/accounts/policy";
import { forgetAccount } from "@/lib/accounts/session";
import { countAgainst, tooMany } from "@/lib/limits/rate";

const Body = z.object({
  current: z.string().max(PASSWORD_MAX).optional(),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
});

// POST /api/account/password { current, password } - change the password, or
// set a first one on an account that signs in with Google. Every session stops
// working, this one included, so the caller signs in again.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // An account with a password proves it knows the current one, in a handful
  // of tries: an open session shouldn't get to guess it.
  if (user.password) {
    const limit = await countAgainst(`password:${userId}`, 10, 60 * 60);
    if (!limit.ok) return tooMany(limit, "Too many tries");
    if (!(parsed.data.current && (await bcrypt.compare(parsed.data.current, user.password)))) {
      return NextResponse.json({ error: "Your current password isn't right" }, { status: 403 });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(parsed.data.password, 10), passwordChangedAt: new Date() },
  });
  forgetAccount(userId);
  return NextResponse.json({ success: true });
}
