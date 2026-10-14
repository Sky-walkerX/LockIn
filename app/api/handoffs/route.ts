import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listHandoffs } from "@/lib/handoff/store";

// GET /api/handoffs - the batons agents left: the open ones first, then the latest taken
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listHandoffs(userId));
}
