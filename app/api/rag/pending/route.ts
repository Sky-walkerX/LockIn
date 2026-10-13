import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { pendingChunks } from "@/lib/rag/freshness";

const DEFAULT_LIMIT = 20;
// What one POST /api/rag/chunks takes.
const MAX_LIMIT = 100;

function parseLimit(raw: string | null): number {
  const n = raw ? Number(raw) : DEFAULT_LIMIT;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.floor(n));
}

/**
 * GET /api/rag/pending?limit=20
 *
 * The next passages to embed, never more than `limit`. A long document is
 * handed out a batch at a time: each call returns the passages of it that
 * aren't stored yet, so the browser embeds and writes it in pieces and an
 * interrupted pass loses one batch at most.
 */
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  return NextResponse.json(await pendingChunks(userId, limit));
}
