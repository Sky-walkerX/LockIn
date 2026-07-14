import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";

// POST /api/uploads — store a pasted/dropped notes image in Supabase Storage.
// Talks to the Storage REST API directly (no @supabase/supabase-js dependency)
// using the service role key, so the bucket needs no RLS policies. The bucket
// is public: markdown `<img>` tags can't send auth headers, and paths are
// unguessable (uuid) — same model as GitHub user-images.

const BUCKET = "lockin-notes";
// 4MB keeps uploads under Vercel's 4.5MB serverless request-body cap.
const MAX_BYTES = 4 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    return NextResponse.json(
      { error: "Image uploads not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" },
      { status: 501 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 413 });
  }

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const upload = () =>
    fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": file.type,
        "Cache-Control": "max-age=31536000, immutable", // uuid path never changes
      },
      body: file,
    });

  let res = await upload();
  if (!res.ok && /bucket not found/i.test(await res.clone().text())) {
    // First upload ever: create the public bucket, then retry once.
    const created = await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
    if (created.ok) res = await upload();
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Supabase Storage upload failed:", res.status, detail);
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 502 });
  }

  return NextResponse.json(
    { url: `${base}/storage/v1/object/public/${BUCKET}/${path}` },
    { status: 201 },
  );
}
