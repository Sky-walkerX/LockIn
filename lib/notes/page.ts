import prisma from "@/lib/prisma";

/**
 * The pages of the notes and resources among some search hits, by id, in two
 * reads at most. Tasks and subjects have no page of their own.
 */
export async function pagesOf(userId: string, hits: { kind: string; id: string }[]): Promise<Map<string, number>> {
  const noteIds = hits.filter((h) => h.kind === "milestone").map((h) => h.id);
  const resourceIds = hits.filter((h) => h.kind === "resource" || h.kind === "document").map((h) => h.id);
  const [notes, resources] = await Promise.all([
    noteIds.length ? prisma.milestone.findMany({ where: { id: { in: noteIds }, subject: { userId } }, select: { id: true, page: true } }) : [],
    resourceIds.length ? prisma.resource.findMany({ where: { id: { in: resourceIds }, userId }, select: { id: true, page: true } }) : [],
  ]);
  const out = new Map<string, number>();
  for (const row of [...notes, ...resources]) if (row.page != null) out.set(row.id, row.page);
  return out;
}

/**
 * Takes the next page in the user's notebook for a new note or resource. One
 * statement, so two saves at once can't get the same page. A page taken by a
 * save that then fails is simply skipped, as a torn-out page would be.
 */
export async function takePage(userId: string): Promise<number> {
  const [row] = await prisma.$queryRaw<{ page: number }[]>`
    UPDATE "User" SET "nextPage" = "nextPage" + 1 WHERE "id" = ${userId} RETURNING "nextPage" - 1 AS page`;
  if (!row) throw new Error("No such user");
  return Number(row.page);
}
