import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
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
      tasks: { select: { isCompleted: true } },
    },
  });

  // Shape a lean DTO: drop the raw tasks array, expose progress counts.
  const shaped = subjects.map(({ tasks, ...subject }) => ({
    ...subject,
    totalTasks: subject._count.tasks,
    completedTasks: tasks.filter((t) => t.isCompleted).length,
  }));

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
