import prisma from "@/lib/prisma";

// What an agent asked the user to look at: notes it flagged as possibly out
// of date, and replacements it wrote that wait for the user's witness (the
// old page stands until then). The home page lists both.

const PLACE = { subject: { select: { id: true, title: true, isInbox: true } } } as const;

export async function listAttention(userId: string) {
  const live = { userId, isArchived: false };
  const [flagged, proposals] = await Promise.all([
    prisma.milestone.findMany({
      where: { staleReason: { not: null }, subject: live },
      orderBy: { staleAt: "desc" },
      take: 10,
      select: { id: true, page: true, title: true, staleReason: true, staleBy: true, staleAt: true, ...PLACE },
    }),
    prisma.milestone.findMany({
      where: { supersedesId: { not: null }, witnessedAt: null, subject: live },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, page: true, title: true, source: true, supersedes: { select: { id: true, page: true, title: true } }, ...PLACE },
    }),
  ]);
  return { flagged, proposals };
}

export type Attention = Awaited<ReturnType<typeof listAttention>>;
