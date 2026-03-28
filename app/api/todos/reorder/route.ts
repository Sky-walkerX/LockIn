import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { z } from "zod";

const ReorderSchema = z.object({
  orderedIds: z.array(z.string()),
});

// POST /api/todos/reorder - Reorder tasks by setting sortOrder
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    // Update sortOrder for each task
    const updates = parsed.data.orderedIds.map((id, index) =>
      prisma.todo.updateMany({
        where: { id, userId: token.sub as string },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering todos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
