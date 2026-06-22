import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const UpdateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  order: z.number().int().optional(),
  isCompleted: z.boolean().optional(),
});

// Ownership for a milestone is enforced through its subject's userId.
async function ownedMilestone(id: string, userId: string) {
  return prisma.milestone.findFirst({ where: { id, subject: { userId } } });
}

// PUT /api/milestones/[id] - update title/notes/order/completion
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateMilestoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  if (!(await ownedMilestone(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const milestone = await prisma.milestone.update({ where: { id }, data: parsed.data });
  return NextResponse.json(milestone);
}

// DELETE /api/milestones/[id] - its tasks survive (milestoneId set to null)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  if (!(await ownedMilestone(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
