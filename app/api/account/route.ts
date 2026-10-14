import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { forgetAccount } from "@/lib/accounts/session";
import { getAccount } from "@/lib/accounts/account";
import { deleteUserFiles } from "@/lib/storage";
import { countAgainst, tooMany } from "@/lib/limits/rate";

const Body = z.object({ confirm: z.string().max(254), password: z.string().max(200).optional() });

// GET /api/account - what Settings and the spine show about the account.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = await getAccount(userId);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(account);
}

// DELETE /api/account { confirm: <your email> } - delete the account and
// everything in it: subjects, notes, plans, resources and their files, chats,
// share links, agent tokens and connected apps. It can't be undone, so the
// caller types the account's address to confirm, and its password too when it
// has one: a session left open on a shared machine isn't enough to do this.
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, password: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!parsed.success || parsed.data.confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Type your email address to confirm" }, { status: 400 });
  }
  if (user.password) {
    const limit = await countAgainst(`password:${userId}`, 10, 60 * 60);
    if (!limit.ok) return tooMany(limit, "Too many tries");
    if (!(parsed.data.password && (await bcrypt.compare(parsed.data.password, user.password)))) {
      return NextResponse.json({ error: "Your password isn't right" }, { status: 403 });
    }
  }

  // Everything the user owns hangs off the user row and goes with it. Sign-in
  // codes for connected apps name the user without a foreign key, so they're
  // removed alongside.
  await prisma.$transaction([
    prisma.oAuthCode.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  forgetAccount(userId);
  await deleteUserFiles(userId).catch((error) => console.error("Removing a deleted account's files failed", error));

  return NextResponse.json({ success: true });
}
