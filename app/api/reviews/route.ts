import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

// GET /api/reviews?before= - milestones due for revision, across subjects.
// Like Today's tasks, the client passes its local end-of-day as ?before= so
// "due today" follows the user's timezone, not the server's.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const beforeParam = request.nextUrl.searchParams.get("before");
  const before = beforeParam ? new Date(beforeParam) : new Date();
  if (isNaN(before.getTime())) return NextResponse.json({ error: "Invalid before" }, { status: 400 });

  const reviews = await prisma.milestone.findMany({
    where: {
      isCompleted: true,
      reviewDueAt: { not: null, lte: before },
      subject: { userId, isArchived: false },
    },
    orderBy: { reviewDueAt: "asc" },
    // Notes stay out: Today only needs the title, and the link opens the topic.
    omit: { notes: true },
    include: { subject: { select: { id: true, title: true, color: true } } },
  });
  return NextResponse.json(reviews);
}
