import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const ReorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

// POST /api/milestones/reorder - persist a new manual order for a subject's
// milestones. `ids` is the full list in its new order; each milestone's
// `order` becomes its index. One transaction, so a partial failure can't
// leave duplicate orders.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { ids } = parsed.data;

  // Milestones carry no userId; ownership is enforced through the subject.
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.milestone.updateMany({ where: { id, subject: { userId } }, data: { order: index } }),
    ),
  );

  return NextResponse.json({ success: true });
}
