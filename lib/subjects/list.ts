import prisma from "@/lib/prisma";
import { computeCoverage } from "@/lib/pace/pace";

// The user's active subjects with task progress: GET /api/subjects, and the
// notebook layout's prefetch of the same query.
export async function listSubjects(userId: string) {
  const subjects = await prisma.subject.findMany({
    // The Inbox is a subject underneath but never listed as one.
    where: { userId, isArchived: false, isInbox: false },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { milestones: true, tasks: true, resources: true } },
      tasks: { select: { isCompleted: true, milestoneId: true } },
      milestones: { select: { id: true, weight: true, isCompleted: true } },
    },
  });

  // Shape a lean DTO: drop the raw tasks and milestones, expose progress
  // counts and syllabus coverage (the card works out exam pace from it).
  const shaped = subjects.map(({ tasks, milestones, ...subject }) => {
    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const coverage = computeCoverage(
      milestones.map((m) => {
        const own = tasks.filter((t) => t.milestoneId === m.id);
        return {
          weight: m.weight,
          isCompleted: m.isCompleted,
          doneTasks: own.filter((t) => t.isCompleted).length,
          totalTasks: own.length,
        };
      }),
      { done: completedTasks, total: tasks.length },
    );
    return { ...subject, totalTasks: subject._count.tasks, completedTasks, coverage };
  });

  return shaped;
}
