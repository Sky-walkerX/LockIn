import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { forgetAccount } from "@/lib/accounts/session";
import { deleteUserFiles } from "@/lib/storage";

const Body = z.object({ confirm: z.string().max(254) });

// GET /api/account - what Settings shows about the account. Never the password itself.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, password: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email: user.email, name: user.name, hasPassword: !!user.password, createdAt: user.createdAt });
}

// DELETE /api/account { confirm: <your email> } - delete the account and
// everything in it: subjects, notes, plans, resources and their files, chats,
// share links, agent tokens and connected apps. It can't be undone, so the
// caller types the account's address to confirm.
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!parsed.success || parsed.data.confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Type your email address to confirm" }, { status: 400 });
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
