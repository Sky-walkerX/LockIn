import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { searchKeyword } from "@/lib/search/keyword";

// GET /api/search?q= - titles and notes (code included) across the user's
// subjects, notes, tasks, subtasks and resources, ranked for the palette.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await searchKeyword(userId, request.nextUrl.searchParams.get("q") ?? ""));
}
