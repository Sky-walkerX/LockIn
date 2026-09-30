import prisma from "@/lib/prisma";

export const INBOX_TITLE = "Inbox";

/**
 * The id of the user's Inbox: the subject unfiled notes land in. Created on
 * first use. Prisma can't express "one isInbox row per user" as a partial
 * unique index, so two first requests racing each other are serialised with a
 * transaction-scoped advisory lock on the user id, which is safe behind the
 * transaction pooler (a session lock would not be).
 */
export async function getOrCreateInbox(userId: string): Promise<string> {
  const found = await prisma.subject.findFirst({ where: { userId, isInbox: true }, select: { id: true } });
  if (found) return found.id;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtext(${userId}))) AS locked`;
    const again = await tx.subject.findFirst({ where: { userId, isInbox: true }, select: { id: true } });
    if (again) return again.id;
    const created = await tx.subject.create({
      data: { userId, title: INBOX_TITLE, isInbox: true },
      select: { id: true },
    });
    return created.id;
  });
}
