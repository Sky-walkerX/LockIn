import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { publicOrigin } from "@/lib/http/origin";
import { putObject } from "@/lib/storage";

// POST /api/uploads — store a pasted/dropped notes image. Where it goes
// (Supabase Storage, or local disk when self-hosted) is lib/storage's call.
// The URL is public by unguessable path: markdown `<img>` tags can't send
// auth headers — same model as GitHub user-images.

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

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 413 });
  }

  try {
    const url = await putObject("notes", `${userId}/${crypto.randomUUID()}.${ext}`, file, publicOrigin(request));
    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 502 });
  }
}
