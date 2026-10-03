import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createSubtask } from "@/lib/tasks/create";
import { z } from "zod";

const SubtaskSchema = z.object({
  taskId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
});

// POST /api/subtasks - create a subtask under a task the user owns.
// Subtasks have no userId; ownership is via task -> subject -> user.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = SubtaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const subtask = await createSubtask(userId, parsed.data);
  if (subtask === "task-missing") return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (subtask === "parent-missing") return NextResponse.json({ error: "Parent subtask not found" }, { status: 404 });
  if (subtask === "too-deep") return NextResponse.json({ error: "Nesting is limited to one level" }, { status: 400 });
  return NextResponse.json(subtask, { status: 201 });
}
