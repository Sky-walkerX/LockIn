import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listAttention } from "@/lib/notes/attention";

// GET /api/notes/attention - notes agents flagged, and replacements waiting for the user's witness
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listAttention(userId));
}
