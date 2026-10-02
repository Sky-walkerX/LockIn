import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listRecentNotes } from "@/lib/notes/recent";

// GET /api/notes/recent?limit=12 - the user's most recently changed notes, across subjects
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 12);
  const limit = Number.isFinite(raw) ? Math.min(Math.max(Math.trunc(raw), 1), 50) : 12;

  return NextResponse.json(await listRecentNotes(userId, limit));
}
