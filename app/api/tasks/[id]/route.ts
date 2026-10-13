import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { appendToTask, saveTaskNotes, updateTask } from "@/lib/tasks/update";
import { ZONE_COOKIE, localDay } from "@/lib/zone";
import { z } from "zod";
import * as f from "@/lib/http/fields";

const UpdateTaskSchema = z.object({
  title: f.title.optional(),
  description: f.body.nullable().optional(),
  isCompleted: z.boolean().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedTime: z.number().int().positive().nullable().optional(),
  milestoneId: f.id.nullable().optional(),
  timeSpent: z.number().int().nonnegative().nullable().optional(),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).nullable().optional(),
  // With `description`: the bodyRev of the text the edit started from. The notes are
  // saved only if they still say that (lib/notes/revision.ts).
  base: z.string().max(64).optional(),
  // A labelled block added to the end of the notes ("from focus", "from chat").
  append: z.object({ text: z.string().trim().min(1).max(100_000), label: z.string().trim().min(1).max(40) }).optional(),
});

// PUT /api/tasks/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const { append, base, ...patch } = parsed.data;
  // An addition builds on the notes as they are now, so it takes the row lock.
  const appended = append
    ? await appendToTask(userId, id, append.text, { label: append.label, day: localDay(request.cookies.get(ZONE_COOKIE)?.value) })
    : null;
  if (append && !appended) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The editor's save: refused if the notes changed since the edit began.
  let saved = appended;
  if (base !== undefined && patch.description !== undefined) {
    const result = await saveTaskNotes(userId, id, patch.description, base);
    if (result.kind === "missing") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (result.kind === "conflict") {
      return NextResponse.json({ error: "These notes changed while you were editing them", current: result.current }, { status: 409 });
    }
    saved = result.row;
    delete patch.description;
  }

  const updated = await updateTask(userId, id, patch);
  const task = updated === "empty" && saved ? saved : updated;
  if (task === "empty") return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

// DELETE /api/tasks/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.task.deleteMany({ where: { id, userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
