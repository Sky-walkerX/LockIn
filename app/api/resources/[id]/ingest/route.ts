import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

/**
 * POST /api/resources/[id]/ingest
 *
 * Turns a resource's URL into indexable markdown by calling the Python ingest
 * service's `/parse`, and stores the result on `Resource.extracted`. From
 * there it's just another source: the next `/api/rag/status` poll sees it
 * through `lib/rag/sources.ts`'s `RESOURCE_DOC` producer and the existing
 * pending → embed → chunks loop indexes it exactly like a note. No new
 * indexing code exists because none was needed.
 *
 * This is a synchronous, on-demand action — the user clicks "Extract text"
 * and waits — not a background job. LockIn has no queue and no cron (see
 * `useIndexing`'s doc comment), and a PDF's text does not change on its own,
 * so there is nothing for a queue to do that a button press doesn't already
 * cover.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const resource = await prisma.resource.findFirst({ where: { id, userId } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ingestUrl = process.env.INGEST_URL;
  const ingestSecret = process.env.INGEST_SECRET;
  if (!ingestUrl || !ingestSecret) {
    return NextResponse.json({ error: "Document extraction is not configured" }, { status: 503 });
  }

  await prisma.resource.update({ where: { id }, data: { ingestState: "PENDING", ingestError: null } });

  // LINK resources point at a page to read; PDF/BOOK point at a document.
  // AI_CHAT has no fetchable content and is rejected before this point by the
  // UI, but a stale request is handled the same way any other bad input is.
  const kind = resource.type === "LINK" ? "html" : "pdf";

  let upstream: Response;
  try {
    upstream = await fetch(new URL("/parse", ingestUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ingestSecret}` },
      body: JSON.stringify({ url: resource.url, kind }),
      // Textbook-sized PDFs take real time; this is a user-initiated action
      // they're watching, not a background poll that should time out fast.
      signal: AbortSignal.timeout(150_000),
    });
  } catch {
    await fail(id, "Could not reach the extraction service.");
    return NextResponse.json({ error: "Ingest service unreachable" }, { status: 503 });
  }

  if (!upstream.ok) {
    const body = await upstream.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : `Extraction failed (${upstream.status}).`;
    await fail(id, message);
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const parsed = (await upstream.json()) as { markdown: string; pages: number | null; chars: number };

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      extracted: parsed.markdown,
      pageCount: parsed.pages,
      ingestState: "READY",
      ingestError: null,
    },
  });

  return NextResponse.json({
    ingestState: updated.ingestState,
    pageCount: updated.pageCount,
    chars: parsed.chars,
  });
}

async function fail(id: string, message: string): Promise<void> {
  await prisma.resource.update({ where: { id }, data: { ingestState: "FAILED", ingestError: message } });
}
