import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { nextReview, REVIEW_RATINGS } from "@/lib/review/schedule";
import { z } from "zod";

const ReviewSchema = z.object({ rating: z.enum(REVIEW_RATINGS) });

// POST /api/milestones/[id]/review - rate a revision and schedule the next one
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = ReviewSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const current = await prisma.milestone.findFirst({
    where: { id, subject: { userId } },
    select: { reviewInterval: true, reviewCount: true },
  });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = nextReview(current, parsed.data.rating, new Date());
  const milestone = await prisma.milestone.update({ where: { id }, data: next });
  return NextResponse.json(milestone);
}
