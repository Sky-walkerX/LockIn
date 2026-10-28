import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { publicOrigin } from "@/lib/http/origin";
import { BUCKETS, IMAGE_EXT, putObject } from "@/lib/storage";
import { fitsQuota, quotaMessage, recordFile, removeFile, withinQuota } from "@/lib/storage/quota";
import { countAgainst, tooMany } from "@/lib/limits/rate";

// POST /api/uploads — store a pasted/dropped notes image. Where it goes
// (Supabase Storage, or local disk when self-hosted) is lib/storage's call.
// The URL is public by unguessable path: markdown `<img>` tags can't send
// auth headers — same model as GitHub user-images.

// 4MB keeps uploads under Vercel's 4.5MB serverless request-body cap.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await countAgainst(`upload:${userId}`, 60, 60);
  if (!limit.ok) return tooMany(limit, "Too many uploads");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = IMAGE_EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Unsupported image type" }, { status: 415 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 413 });
  }

  if (!(await fitsQuota(userId, file.size))) return NextResponse.json({ error: quotaMessage() }, { status: 413 });

  try {
    const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
    const url = await putObject("notes", objectPath, file, publicOrigin(request));
    const key = `${BUCKETS.notes}/${objectPath}`;
    await recordFile(userId, key, file.size);
    // Asked again now that it's counted: images sent in the same moment were
    // each told there was room.
    if (!(await withinQuota(userId))) {
      await removeFile(key, "Removing an image over quota failed");
      return NextResponse.json({ error: quotaMessage() }, { status: 413 });
    }
    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 502 });
  }
}
