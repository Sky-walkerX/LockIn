import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listTasks, listTasksDue } from "@/lib/tasks/list";
import { createTask } from "@/lib/tasks/create";
import { z } from "zod";

const TaskSchema = z.object({
  subjectId: z.string().min(1),
  milestoneId: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedTime: z.number().int().positive().optional(),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).nullable().optional(),
});

// GET /api/tasks
//   ?subjectId=  / ?milestoneId=  -> filter within a subject/milestone
//   ?today=true                   -> incomplete tasks due today or overdue, across all
//                                    subjects (for the cross-subject "Today" view)
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const subjectId = sp.get("subjectId");
  const milestoneId = sp.get("milestoneId");

  if (sp.get("today") === "true") {
    // The client passes its local end-of-day as ?before= so "today" follows
    // the user's timezone, not the server's; fall back to server-local.
    const beforeParam = sp.get("before");
    const clientBefore = beforeParam ? new Date(beforeParam) : null;
    let endOfToday: Date;
    if (clientBefore && !isNaN(clientBefore.getTime())) {
      endOfToday = clientBefore;
    } else {
      endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
    }

    return NextResponse.json(await listTasksDue(userId, endOfToday));
  }

  return NextResponse.json(await listTasks(userId, { subjectId, milestoneId }));
}

// POST /api/tasks - create a task under a subject (milestone optional)
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = TaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const task = await createTask(userId, parsed.data);
  if (task === "subject-missing") return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  if (task === "note-missing") return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  return NextResponse.json(task, { status: 201 });
}
