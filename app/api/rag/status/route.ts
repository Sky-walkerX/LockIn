import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { EMBEDDING_DIMS, EMBEDDING_MODEL } from "@/lib/rag/embedding-model";
import { indexStatus } from "@/lib/rag/freshness";

/**
 * GET /api/rag/status
 *
 * How much of the notebook is indexed and what needs work, counted in the
 * database (lib/rag/freshness.ts). A pure read: the orphan count it returns
 * is a finding, not an action. Deleting orphans is `POST /api/rag/sweep`,
 * which the indexing loop calls when this reports some: a GET that React
 * Query re-runs on every mount and refetch has no business deleting rows.
 */
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ ...(await indexStatus(userId)), model: EMBEDDING_MODEL, dims: EMBEDDING_DIMS });
}
