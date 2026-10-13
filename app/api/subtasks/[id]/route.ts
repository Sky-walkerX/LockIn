import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { appendToSubtask, updateSubtask } from "@/lib/tasks/update";
import { ZONE_COOKIE, localDay } from "@/lib/zone";
import { z } from "zod";
import * as f from "@/lib/http/fields";

const UpdateSubtaskSchema = z.object({
  title: f.title.optional(),
  notes: f.body.optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().optional(),
  // A labelled block added to the end of the notes ("from focus", "from chat").
  append: z.object({ text: z.string().trim().min(1).max(100_000), label: z.string().trim().min(1).max(40) }).optional(),
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

  const { append, ...patch } = parsed.data;
  // An addition builds on the notes as they are now, so it takes the row lock.
  const appended = append
    ? await appendToSubtask(userId, id, append.text, { label: append.label, day: localDay(request.cookies.get(ZONE_COOKIE)?.value) })
    : null;
  if (append && !appended) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await updateSubtask(userId, id, patch);
  const subtask = updated === "empty" && appended ? appended : updated;
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
