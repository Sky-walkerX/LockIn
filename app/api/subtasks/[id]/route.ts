import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { updateSubtask } from "@/lib/tasks/update";
import { z } from "zod";

const UpdateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().optional(),
});

// PUT /api/subtasks/[id] - update title/notes/completion/order.
// Scoped through task -> subject -> user (subtasks carry no userId).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateSubtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const subtask = await updateSubtask(userId, id, parsed.data);
  if (subtask === "empty") return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  if (!subtask) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subtask);
}

// DELETE /api/subtasks/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.subtask.deleteMany({
    where: { id, task: { subject: { userId } } },
  });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
