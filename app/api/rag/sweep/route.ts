import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { sweepOrphans } from "@/lib/rag/freshness";

/**
 * POST /api/rag/sweep
 *
 * Deletes stored chunks whose source record no longer exists. It's separate
 * from `/api/rag/status` so that reporting state and changing it are separate
 * requests: status is polled, this is called once, only when status says
 * there is something to clean up.
 *
 * Orphans come from deleting a milestone, task, subtask or resource, or from
 * clearing a note's text. Subject and account deletion cascade in the schema
 * and never reach here.
 */
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ deleted: await sweepOrphans(userId) });
}
