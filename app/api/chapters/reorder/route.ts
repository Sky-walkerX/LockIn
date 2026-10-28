import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";
import * as f from "@/lib/http/fields";

const ReorderSchema = z.object({ ids: f.ids });

// POST /api/chapters/reorder - persist a new order for a subject's chapters.
// `ids` is the full list in its new order; each chapter's `order` becomes its
// index. One transaction, so a partial failure can't leave duplicate orders.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  await prisma.$transaction(
    parsed.data.ids.map((id, index) =>
      prisma.chapter.updateMany({ where: { id, subject: { userId } }, data: { order: index } }),
    ),
  );
  return NextResponse.json({ success: true });
}
