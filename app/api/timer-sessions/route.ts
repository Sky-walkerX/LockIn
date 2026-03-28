import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { z } from "zod";

const CreateSessionSchema = z.object({
  todoId: z.string().uuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  duration: z.number().int().positive(),
});

// POST /api/timer-sessions - Save a completed timer session
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the todo belongs to the user
    const todo = await prisma.todo.findFirst({
      where: { id: parsed.data.todoId, userId: token.sub },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const session = await prisma.timerSession.create({
      data: {
        todoId: parsed.data.todoId,
        startedAt: new Date(parsed.data.startedAt),
        endedAt: new Date(parsed.data.endedAt),
        duration: parsed.data.duration,
      },
    });

    // Also update the todo's timeSpent
    await prisma.todo.update({
      where: { id: parsed.data.todoId },
      data: { timeSpent: (todo.timeSpent || 0) + parsed.data.duration },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Error creating timer session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/timer-sessions - Get all timer sessions for the user
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.timerSession.findMany({
      where: {
        todo: { userId: token.sub },
      },
      include: {
        todo: { select: { title: true, priority: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching timer sessions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
