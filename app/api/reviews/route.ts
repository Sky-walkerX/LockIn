import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listDueReviews } from "@/lib/review/due";

// GET /api/reviews?before= - milestones due for revision, across subjects.
// Like Today's tasks, the client passes its local end-of-day as ?before= so
// "due today" follows the user's timezone, not the server's.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const beforeParam = request.nextUrl.searchParams.get("before");
  const before = beforeParam ? new Date(beforeParam) : new Date();
  if (isNaN(before.getTime())) return NextResponse.json({ error: "Invalid before" }, { status: 400 });

  return NextResponse.json(await listDueReviews(userId, before));
}
