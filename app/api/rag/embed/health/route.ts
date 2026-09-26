import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

/**
 * GET /api/rag/embed/health
 *
 * Two callers: `lib/llm/embedder.ts` probes this once to decide whether the
 * remote backend is worth trying at all, and the Ask panel fires it
 * fire-and-forget on mount purely to warm a scaled-to-zero Cloud Run
 * container before the user has typed anything. Neither cares about the
 * response body — only whether it came back — so this stays a cheap
 * pass-through rather than duplicating `/embed`'s validation.
 */
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ingestUrl = process.env.INGEST_URL;
  if (!ingestUrl) {
    return NextResponse.json({ available: false }, { status: 503 });
  }

  try {
    // No secret needed — /health is deliberately public on the ingest side
    // so Cloud Run's own probes and this warm-up ping don't need a credential.
    const upstream = await fetch(new URL("/health", ingestUrl), {
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ available: upstream.ok }, { status: upstream.ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ available: false }, { status: 503 });
  }
}
