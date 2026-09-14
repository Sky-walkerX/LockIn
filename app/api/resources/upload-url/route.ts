import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

/**
 * POST /api/resources/upload-url
 *
 * Mints a Supabase Storage signed upload URL so a local PDF can reach Storage
 * directly from the browser, bypassing this server entirely.
 *
 * `/api/uploads` (notes images) caps at 4MB because of Vercel's 4.5MB
 * serverless body limit — fine for a pasted screenshot, useless for a
 * textbook. A signed upload URL sidesteps that limit the same way a
 * presigned S3 URL would: the browser PUTs bytes straight to Supabase, and
 * this route never sees the file body, only its name and size.
 *
 * Same bucket-creation-on-first-use and public-bucket-with-uuid-path model as
 * `/api/uploads` — see that route for why a public bucket is an acceptable
 * choice here (unguessable paths, single-user app, and `/parse` needs a URL
 * it can fetch without forwarding a second credential).
 */

const BUCKET = "lockin-docs";
// Mirrors service/app/config.py's MAX_DOWNLOAD_BYTES — a file too large for
// the parser to fetch is a file too large to accept here.
const MAX_BYTES = 50 * 1024 * 1024;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    return NextResponse.json(
      { error: "Document uploads not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" },
      { status: 501 },
    );
  }

  const body = await request.json().catch(() => null);
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  const ext = EXT[contentType];
  if (!ext) return NextResponse.json({ error: "Only PDF uploads are supported" }, { status: 415 });
  if (size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: `File must be under ${MAX_BYTES / 1024 / 1024}MB` }, { status: 413 });
  }

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const sign = () =>
    fetch(`${base}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
    });

  let res = await sign();
  // A missing bucket on the *signed-upload-url* endpoint doesn't say "bucket
  // not found" (that text is `/api/uploads`'s plain-object-POST endpoint) —
  // it comes back as a generic { code: "InvalidRequest", message: "The
  // related resource does not exist" }. Confirmed directly against Supabase
  // rather than assumed, since copying the other route's regex here would
  // have silently never triggered the fallback on a fresh install.
  if (!res.ok && (await res.clone().json().catch(() => null))?.code === "InvalidRequest") {
    // First document upload ever: create the bucket, then retry once. Same
    // lazy-create pattern as `/api/uploads`.
    const created = await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, fileSizeLimit: MAX_BYTES }),
    });
    if (created.ok) res = await sign();
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Supabase signed-upload-url request failed:", res.status, detail);
    return NextResponse.json({ error: "Could not prepare the upload" }, { status: 502 });
  }

  // `{ url, token }` where `url` is a path like
  // "/object/upload/sign/<bucket>/<path>?token=...". The browser PUTs the
  // file to `${base}/storage/v1${url}` directly — this route is done once it
  // hands that back.
  const { url: signedPath } = (await res.json()) as { url: string; token: string };

  return NextResponse.json({
    uploadUrl: `${base}/storage/v1${signedPath}`,
    publicUrl: `${base}/storage/v1/object/public/${BUCKET}/${path}`,
  });
}
