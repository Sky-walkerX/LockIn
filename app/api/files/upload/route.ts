import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CONTENT_TYPES, localPath, storageDriver, verifyUpload } from "@/lib/storage";

// PUT /api/files/upload?key=…&exp=…&max=…&sig=… — the local stand-in for a
// Supabase signed upload URL. The signed query names the one key the browser
// may write, its size cap and an expiry (lib/storage signUpload); the body is
// streamed to disk and abandoned if it runs past the cap.
export async function PUT(request: Request) {
  if (storageDriver() !== "local") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const q = new URL(request.url).searchParams;
  const key = q.get("key") ?? "";
  const exp = Number(q.get("exp"));
  const max = Number(q.get("max"));
  if (!verifyUpload(key, exp, max, q.get("sig") ?? "")) {
    return NextResponse.json({ error: "This upload link is invalid or has expired" }, { status: 403 });
  }
  const full = localPath(key);
  if (!full || !request.body) return NextResponse.json({ error: "Nothing to upload" }, { status: 400 });

  const ext = key.slice(key.lastIndexOf(".") + 1);
  const type = request.headers.get("content-type")?.split(";")[0].trim();
  if (type && type !== CONTENT_TYPES[ext]) {
    return NextResponse.json({ error: "Wrong file type for this upload" }, { status: 415 });
  }

  await mkdir(path.dirname(full), { recursive: true });
  // Claim the key before writing a byte: "wx" fails if it already exists, so a
  // replayed link can never overwrite (or, on error, delete) someone's file.
  let file;
  try {
    file = await open(full, "wx");
  } catch {
    return NextResponse.json({ error: "This upload link has already been used" }, { status: 409 });
  }

  let written = 0;
  try {
    for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
      written += chunk.byteLength;
      if (written > max) throw new Error("too large");
      await file.write(chunk);
    }
    await file.close();
  } catch (error) {
    // Only the file this request created is removed.
    await file.close().catch(() => {});
    await rm(full, { force: true });
    const tooLarge = error instanceof Error && error.message === "too large";
    return NextResponse.json(
      { error: tooLarge ? `File must be under ${Math.floor(max / 1024 / 1024)}MB` : "Upload failed" },
      { status: tooLarge ? 413 : 500 },
    );
  }
  return new Response(null, { status: 201 });
}
