import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const TimerSchema = z.object({ action: z.enum(["start", "stop"]) });

// POST /api/tasks/[id]/timer  { action: "start" | "stop" }
// start -> opens a TimerSession; stop -> closes the open session, records its
// duration (minutes), and rolls it up into Task.timeSpent.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = TimerSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  if (parsed.data.action === "start") {
    const session = await prisma.timerSession.create({
      data: { taskId: id, startedAt: new Date() },
    });
    return NextResponse.json(session, { status: 201 });
  }

  // stop
  const open = await prisma.timerSession.findFirst({
    where: { taskId: id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!open) return NextResponse.json({ error: "No active timer session" }, { status: 400 });

  const endedAt = new Date();
  const duration = Math.max(0, Math.round((endedAt.getTime() - open.startedAt.getTime()) / 60000));

  const [session, updatedTask] = await prisma.$transaction([
    prisma.timerSession.update({ where: { id: open.id }, data: { endedAt, duration } }),
    prisma.task.update({ where: { id }, data: { timeSpent: { increment: duration } } }),
  ]);

  return NextResponse.json({ session, task: updatedTask });
}
