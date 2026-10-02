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

export type InboxSummary = {
  id: string;
  /** Notes sitting in the Inbox. */
  count: number;
  /** Agents' notes anywhere in the notebook that the user hasn't witnessed. */
  awaiting: number;
};

// The Inbox's id, how many notes it holds, and how many notes an agent wrote
// that are still waiting to be witnessed (anywhere in the notebook).
export async function getInboxSummary(userId: string): Promise<InboxSummary> {
  const id = await getOrCreateInbox(userId);
  const [row] = await prisma.$queryRaw<{ count: number; awaiting: number }[]>`
    SELECT count(*) FILTER (WHERE m."subjectId" = ${id})::int AS count,
           count(*) FILTER (WHERE m.source IS NOT NULL AND m.source <> 'web' AND m."witnessedAt" IS NULL)::int AS awaiting
    FROM "Milestone" m
    JOIN "Subject" s ON s.id = m."subjectId"
    WHERE s."userId" = ${userId}`;
  return { id, count: row?.count ?? 0, awaiting: row?.awaiting ?? 0 };
}
