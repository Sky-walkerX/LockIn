import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { computeCoverage } from "@/lib/pace/pace";
import { z } from "zod";

const SubjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/subjects - list the user's active subjects with task progress
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await prisma.subject.findMany({
    where: { userId, isArchived: false },
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

  return NextResponse.json(shaped);
}

// POST /api/subjects - create a subject
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = SubjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const subject = await prisma.subject.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(subject, { status: 201 });
}
