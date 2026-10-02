import prisma from "@/lib/prisma";

// Finished topics whose revision is due by `before`, with their subject.
export function listDueReviews(userId: string, before: Date) {
  return prisma.milestone.findMany({
    where: {
      isCompleted: true,
      reviewDueAt: { not: null, lte: before },
      subject: { userId, isArchived: false },
    },
    orderBy: { reviewDueAt: "asc" },
    // Notes stay out: Today only needs the title, and the link opens the topic.
    omit: { notes: true },
    include: { subject: { select: { id: true, title: true, color: true } } },
  });
}
