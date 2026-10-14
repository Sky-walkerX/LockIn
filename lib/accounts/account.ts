import prisma from "@/lib/prisma";

/** What Settings and the spine show about an account. Never the password itself. */
export async function getAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, image: true, password: true, createdAt: true },
  });
  if (!user) return null;
  const { password, ...shown } = user;
  return { ...shown, hasPassword: !!password };
}
