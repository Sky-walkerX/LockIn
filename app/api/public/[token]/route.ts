import { NextResponse } from "next/server";
import { loadShare } from "@/lib/share/load";

/**
 * GET /api/public/[token] — the one route in this app that takes no session.
 *
 * Holding the token is the entire authorization check. Deliberately no
 * `getUserId` call: a viewer with the link is not, and need not be, a user.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const payload = await loadShare(token);
  if (!payload) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(payload, {
    // A revoked link must stop working promptly, so shared pages are never
    // cached by a CDN — only briefly by the browser that fetched them.
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
