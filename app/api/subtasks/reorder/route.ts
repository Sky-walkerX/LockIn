import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const ReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

// POST /api/subtasks/reorder - persist a new manual order for a task's subtasks.
// Ownership is enforced through the subtask's task -> subject -> user chain.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { ids } = parsed.data;

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.subtask.updateMany({
        where: { id, task: { subject: { userId } } },
        data: { order: index },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
