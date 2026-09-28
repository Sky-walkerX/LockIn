import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { publicOrigin } from "@/lib/http/origin";
import { createUpload } from "@/lib/storage";

/**
 * POST /api/resources/upload-url
 *
 * Hands the browser somewhere to PUT a local PDF directly, so the file never
 * passes through this server: a Supabase signed upload URL on the hosted
 * instance, or a signed /api/files/upload link when self-hosted.
 *
 * `/api/uploads` (notes images) caps at 4MB because of Vercel's 4.5MB
 * serverless body limit — fine for a pasted screenshot, useless for a
 * textbook. A direct upload sidesteps that limit the way a presigned S3 URL
 * would. Public-by-unguessable-path, like images: `/parse` needs a URL it can
 * fetch without a second credential.
 */

// Mirrors service/app/config.py's MAX_DOWNLOAD_BYTES — a file too large for
// the parser to fetch is a file too large to accept here.
const MAX_BYTES = 50 * 1024 * 1024;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  const ext = EXT[contentType];
  if (!ext) return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 415 });
  if (size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: `File must be under ${MAX_BYTES / 1024 / 1024}MB` }, { status: 413 });
  }

  try {
    const target = await createUpload("docs", `${userId}/${crypto.randomUUID()}.${ext}`, MAX_BYTES, publicOrigin(request));
    return NextResponse.json(target);
  } catch {
    return NextResponse.json({ error: "Could not prepare the upload" }, { status: 502 });
  }
}
