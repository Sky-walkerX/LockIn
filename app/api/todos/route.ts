import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Define the Zod schema for validating todo input
const TodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedTime: z.number().int().positive().optional(),
  parentId: z.string().optional(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  recurrenceEndDate: z.string().datetime().optional(),
  tagIds: z.array(z.string()).optional(),
});

// GET /api/todos - Get all todos for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todos = await prisma.todo.findMany({
      where: {
        userId: token.sub,
        parentId: null, // Only top-level tasks
      },
      include: {
        tags: true,
        subTasks: {
          include: { tags: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error in GET /api/todos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/todos - Create a new todo for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = TodoSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({
        error: "Invalid data",
        details: parsedBody.error.flatten(),
      }, { status: 400 });
    }

    const { tagIds, ...todoData } = parsedBody.data;

    const todo = await prisma.todo.create({
      data: {
        ...todoData,
        userId: token.sub,
        ...(tagIds && tagIds.length > 0 && {
          tags: { connect: tagIds.map((id) => ({ id })) },
        }),
      },
      include: {
        tags: true,
        subTasks: true,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
