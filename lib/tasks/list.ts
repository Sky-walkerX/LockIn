import prisma from "@/lib/prisma";

// Unfinished tasks due by `before` (the end of the user's today), with their
// subject: Today on the home page and the spine's count.
export function listTasksDue(userId: string, before: Date) {
  return prisma.task.findMany({
    where: { userId, isCompleted: false, dueDate: { not: null, lte: before } },
    orderBy: { dueDate: "asc" },
    include: { subject: { select: { id: true, title: true, color: true } } },
  });
}

// The user's tasks, optionally narrowed to a subject or a note, oldest first.
export function listTasks(userId: string, filter: { subjectId?: string | null; milestoneId?: string | null } = {}) {
  return prisma.task.findMany({
    where: {
      userId,
      ...(filter.subjectId ? { subjectId: filter.subjectId } : {}),
      ...(filter.milestoneId ? { milestoneId: filter.milestoneId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
}
