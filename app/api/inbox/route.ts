import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getInboxSummary } from "@/lib/subjects/inbox";

// GET /api/inbox - the user's Inbox (created on first call) and its counts
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getInboxSummary(userId));
}
