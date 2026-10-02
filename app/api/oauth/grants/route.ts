import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { listConnectedApps } from "@/lib/connections";

// GET /api/oauth/grants - apps that signed in to this notebook (Claude.ai,
// ChatGPT…) and still have access, newest first.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await listConnectedApps(userId));
}
