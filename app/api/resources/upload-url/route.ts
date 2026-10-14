import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { publicOrigin } from "@/lib/http/origin";
import { BUCKETS, createUpload, storageDriver } from "@/lib/storage";
import { MAX_PDF_BYTES as MAX_BYTES, fitsQuota, holdUpload, quotaMessage, releaseHold } from "@/lib/storage/quota";
import { countAgainst, tooMany } from "@/lib/limits/rate";

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

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await countAgainst(`upload:${userId}`, 60, 60);
  if (!limit.ok) return tooMany(limit, "Too many uploads");

  const body = await request.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  const ext = EXT[contentType];
  if (!ext) return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 415 });
  if (size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: `File must be under ${MAX_BYTES / 1024 / 1024}MB` }, { status: 413 });
  }

  // On local disk the file is counted when it arrives, at its real size
  // (/api/files/upload). Supabase takes the upload itself and its link can't
  // be held to the size the browser gave, so room for the most the link
  // allows is held from here until saving the resource settles it.
  const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
  const key = `${BUCKETS.docs}/${objectPath}`;
  const held = storageDriver() === "supabase";
  if (!(held ? await holdUpload(userId, key, size) : await fitsQuota(userId, size))) {
    return NextResponse.json({ error: quotaMessage() }, { status: 413 });
  }

  try {
    return NextResponse.json(await createUpload("docs", objectPath, MAX_BYTES, publicOrigin(request), size));
  } catch {
    if (held) await releaseHold(key).catch(() => {});
    return NextResponse.json({ error: "Could not prepare the upload" }, { status: 502 });
  }
}
