import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";
import * as f from "@/lib/http/fields";

const ReorderSchema = z.object({
  ids: f.ids,
});

// POST /api/milestones/reorder - persist a new manual order for a subject's
// milestones. `ids` is the full list in its new order; each milestone's
// `order` becomes its index. One statement, so a partial failure can't leave
// duplicate orders, and one round trip however many notes there are.
// Raw SQL rather than updateMany: Prisma would stamp every note's updatedAt,
// and moving a note isn't writing it ("5 days ago" would turn to "now", and
// the note shown by default is the one written last).
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { ids } = parsed.data;

  // Milestones carry no userId; ownership is enforced through the subject.
  await prisma.$executeRaw`
    UPDATE "Milestone" m SET "order" = (v.ord - 1)::int
    FROM unnest(${ids}::text[]) WITH ORDINALITY AS v(id, ord), "Subject" sub
    WHERE m."id" = v.id AND sub."id" = m."subjectId" AND sub."userId" = ${userId}`;

  return NextResponse.json({ success: true });
}
