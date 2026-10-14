import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { publicOrigin } from "@/lib/http/origin";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, clearPhoto, storePhoto } from "@/lib/accounts/photo";
import { quotaMessage } from "@/lib/storage/quota";
import { countAgainst, tooMany } from "@/lib/limits/rate";

// PUT /api/account/photo (multipart, `file`) - a new profile photo, replacing
// the old one. Settings sends a 256px square it has already cropped.
export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await countAgainst(`upload:${userId}`, 60, 60);
  if (!limit.ok) return tooMany(limit, "Too many uploads");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!PHOTO_TYPES[file.type]) return NextResponse.json({ error: "Use a PNG, JPEG or WebP image" }, { status: 415 });
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "The photo must be under 1MB" }, { status: 413 });
  }

  try {
    const url = await storePhoto(userId, file, publicOrigin(request));
    if (!url) return NextResponse.json({ error: quotaMessage() }, { status: 413 });
    return NextResponse.json({ image: url });
  } catch (error) {
    console.error("Storing a profile photo failed", error);
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 502 });
  }
}

// DELETE /api/account/photo - back to the initial.
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearPhoto(userId);
  return NextResponse.json({ image: null });
}
