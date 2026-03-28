import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { awardTaskCompletionXP } from "@/lib/gamification";
import { getNextDueDate, shouldCreateNextOccurrence } from "@/lib/recurrence";

// Define the Zod schema for updating todo input
const UpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  isCompleted: z.boolean().optional(),
  estimatedTime: z.number().int().positive().optional(),
  timeSpent: z.number().int().nonnegative().optional(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

// PUT /api/todos/:id - Update a specific todo for the authenticated user
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const resolvedParams = await params;
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const todoId = resolvedParams.id;
    const { tagIds, ...updateData } = parsed.data;

    // Fetch existing todo to check ownership and get current data
    const existingTodo = await prisma.todo.findFirst({
      where: { id: todoId, userId: token.sub },
      include: { tags: true },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Build update payload
    const data: Record<string, unknown> = { ...updateData };

    // Set completedAt
    if (parsed.data.isCompleted !== undefined) {
      data.completedAt = parsed.data.isCompleted ? new Date() : null;
    }

    // Handle tag updates
    if (tagIds !== undefined) {
      data.tags = {
        set: tagIds.map((id) => ({ id })),
      };
    }

    const todo = await prisma.todo.update({
      where: { id: todoId },
      data,
      include: { tags: true, subTasks: true },
    });

    // Award XP on task completion
    if (parsed.data.isCompleted === true && !existingTodo.isCompleted) {
      await awardTaskCompletionXP(
        token.sub,
        existingTodo.priority,
        existingTodo.isAiSuggested,
        existingTodo.dueDate,
      );

      // Handle recurrence — create next occurrence
      if (
        existingTodo.recurrence !== "NONE" &&
        existingTodo.dueDate &&
        shouldCreateNextOccurrence(existingTodo.recurrence, existingTodo.recurrenceEndDate, existingTodo.dueDate)
      ) {
        const nextDueDate = getNextDueDate(existingTodo.recurrence, existingTodo.dueDate);
        if (nextDueDate) {
          await prisma.todo.create({
            data: {
              title: existingTodo.title,
              description: existingTodo.description,
              priority: existingTodo.priority,
              dueDate: nextDueDate,
              estimatedTime: existingTodo.estimatedTime,
              recurrence: existingTodo.recurrence,
              recurrenceEndDate: existingTodo.recurrenceEndDate,
              userId: token.sub,
              isAiSuggested: existingTodo.isAiSuggested,
              tags: existingTodo.tags.length > 0
                ? { connect: existingTodo.tags.map((t) => ({ id: t.id })) }
                : undefined,
            },
          });
        }
      }
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Error in PUT /api/todos/:id:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/todos/:id - Delete a specific todo for the authenticated user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todoId = resolvedParams.id;
    const deleted = await prisma.todo.deleteMany({
      where: {
        id: todoId,
        userId: token.sub,
      },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Error in DELETE /api/todos/:id:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
