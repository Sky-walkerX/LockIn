import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { setClause } from "@/lib/sql";
import { firstReview } from "@/lib/review/schedule";
import type { Milestone } from "@/app/generated/prisma";
import { z } from "zod";

const UpdateMilestoneSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  order: z.number().int().optional(),
  isCompleted: z.boolean().optional(),
  confidence: z.enum(["WEAK", "OK", "STRONG"]).nullable().optional(),
  // null stops revising the topic; a date (re)starts it.
  reviewDueAt: z.string().datetime().nullable().optional(),
  reviewInterval: z.number().int().positive().nullable().optional(),
});

// See the tasks route: an enum column needs its placeholder cast, or Postgres
// rejects the text -> enum write with error 42804.
const ENUM_CASTS = { confidence: "Confidence" };

// Ownership for a milestone is enforced through its subject's userId — folded
// into each statement's WHERE rather than checked in a separate round trip.

// PUT /api/milestones/[id] - update title/notes/order/completion/revision
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateMilestoneSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const { reviewDueAt, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (reviewDueAt !== undefined) data.reviewDueAt = reviewDueAt ? new Date(reviewDueAt) : null;

  // Un-completing a topic takes it out of revision; completing one schedules
  // its first review — but only when nothing is scheduled yet, so re-sending
  // `isCompleted: true` never resets a schedule in progress. That "only if
  // unset" needs the current row, so it's a COALESCE in the statement rather
  // than a read first.
  const fills: [column: string, value: unknown][] = [];
  if (rest.isCompleted === false) {
    Object.assign(data, { completedAt: null, reviewDueAt: null, reviewInterval: null, reviewCount: 0 });
  } else if (rest.isCompleted === true) {
    fills.push(["completedAt", new Date()]);
    if (reviewDueAt === undefined && rest.reviewInterval === undefined) {
      const first = firstReview(new Date());
      fills.push(["reviewDueAt", first.reviewDueAt], ["reviewInterval", first.reviewInterval]);
    }
  }

  const set = setClause(data, ENUM_CASTS);
  if (!set) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const k = set.values.length;
  // Dates pinned to UTC for the same reason setClause does it.
  const completion = fills
    .map(([col, v], i) => {
      const p = v instanceof Date ? `($${k + i + 1}::timestamptz AT TIME ZONE 'UTC')` : `$${k + i + 1}`;
      return `, "${col}" = COALESCE(m."${col}", ${p})`;
    })
    .join("");
  const extra = fills.map(([, v]) => v);

  const n = set.values.length + extra.length;
  const [milestone] = await prisma.$queryRawUnsafe<Milestone[]>(
    `UPDATE "Milestone" m SET ${set.clause}${completion}, "updatedAt" = (NOW() AT TIME ZONE 'UTC')
     FROM "Subject" sub
     WHERE m."id" = $${n + 1}
       AND sub."id" = m."subjectId"
       AND sub."userId" = $${n + 2}
     RETURNING m.*`,
    ...set.values,
    ...extra,
    id,
    userId,
  );
  if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(milestone);
}

// DELETE /api/milestones/[id] - its tasks survive (milestoneId set to null)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.milestone.deleteMany({ where: { id, subject: { userId } } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
