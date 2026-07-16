import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const UpdateSubjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

// GET /api/subjects/[id] - full subject: milestones (with their tasks),
// loose tasks (no milestone), and resources.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Top-level subtasks only, with their children nested one level deep.
  const subtasks = {
    where: { parentId: null },
    orderBy: { order: "asc" as const },
    include: { children: { orderBy: { order: "asc" as const } } },
  } as const;
  const taskInclude = {
    orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }],
    include: { subtasks },
  };

  const subject = await prisma.subject.findFirst({
    where: { id, userId },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: { tasks: taskInclude },
      },
      tasks: { where: { milestoneId: null }, ...taskInclude },
      resources: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subject);
}

// PUT /api/subjects/[id] - update title/description/color/archive
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateSubjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.subject.updateMany({ where: { id, userId }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subject = await prisma.subject.findUnique({ where: { id } });
  return NextResponse.json(subject);
}

// DELETE /api/subjects/[id] - cascades milestones, tasks, resources
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.subject.deleteMany({ where: { id, userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
