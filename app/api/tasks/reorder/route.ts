import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const ReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

// POST /api/tasks/reorder - persist a new manual order for a list of tasks.
// `ids` is the full list in its new order; each task's `order` becomes its index.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { ids } = parsed.data;

  // Ownership is enforced per-row via `userId` in the where clause.
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.task.updateMany({ where: { id, userId }, data: { order: index } }),
    ),
  );

  return NextResponse.json({ success: true });
}
