import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { BUCKETS, CONTENT_TYPES, localPath, looksLike, ownerOfKey, putObject, storageDriver, storedSize, verifyUpload } from "@/lib/storage";
import { forgetFile, quotaMessage, recordFile, removeFile, withinQuota } from "@/lib/storage/quota";

// PUT /api/files/upload?key=…&exp=…&max=…&sig=… — a signed upload link: the
// local stand-in for a Supabase signed upload URL, and how an agent uploads an
// image into a note (upload_image) on either backend. The signed query names
// the one key it may write, its size cap and an expiry (lib/storage
// signUpload); a body that runs past the cap is abandoned.

// Enough of a file's start to tell what it is (lib/storage looksLike).
const HEAD_BYTES = 12;

export async function PUT(request: Request) {
  const q = new URL(request.url).searchParams;
  const key = q.get("key") ?? "";
  // On Supabase, PDFs are uploaded to Supabase directly; only agents' images
  // come through here, to be checked and counted on the way.
  const toSupabase = storageDriver() === "supabase";
  if (toSupabase && !key.startsWith(`${BUCKETS.notes}/`)) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const notThat = () => NextResponse.json({ error: `That isn't a ${ext.toUpperCase()} image` }, { status: 415 });
  const tooLarge = () => NextResponse.json({ error: `The file is larger than this link allows (${max} bytes)` }, { status: 413 });

  if (toSupabase) {
    // Held here whole (an image is at most a few MB), then stored. A key
    // that already holds a file has had its one use.
    if (typeof (await storedSize(key)) === "number") {
      return NextResponse.json({ error: "This upload link has already been used" }, { status: 409 });
    }
    const chunks: Uint8Array[] = [];
    let written = 0;
    for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
      written += chunk.byteLength;
      if (written > max) return tooLarge();
      chunks.push(chunk);
    }
    const body = new Blob(chunks as BlobPart[], { type: CONTENT_TYPES[ext] });
    if (!looksLike(ext, new Uint8Array(await body.slice(0, HEAD_BYTES).arrayBuffer()))) return notThat();
    try {
      await putObject("notes", key.slice(key.indexOf("/") + 1), body, "");
    } catch {
      return NextResponse.json({ error: "Upload to storage failed" }, { status: 502 });
    }
    return counted(key, written, () => removeFile(key, "Removing an image over quota failed"));
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
  let head = new Uint8Array(0);
  try {
    for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
      written += chunk.byteLength;
      if (written > max) throw new Error("too large");
      if (head.length < HEAD_BYTES) head = new Uint8Array([...head, ...chunk.subarray(0, HEAD_BYTES - head.length)]);
      await file.write(chunk);
    }
    await file.close();
  } catch (error) {
    // Only the file this request created is removed.
    await file.close().catch(() => {});
    await rm(full, { force: true });
    return error instanceof Error && error.message === "too large"
      ? tooLarge()
      : NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
  if (!looksLike(ext, head)) {
    await rm(full, { force: true });
    return notThat();
  }
  return counted(key, written, async () => {
    await rm(full, { force: true });
    await forgetFile(key).catch((error) => console.error("Forgetting a refused upload failed", error));
  });
}

// Counted against its owner's quota, at the size that really arrived, and
// only then held against it: links handed out in the same moment were each
// told there was room. A file that can't be counted isn't kept.
async function counted(key: string, written: number, discard: () => Promise<void>) {
  const owner = ownerOfKey(key);
  if (owner) {
    const fits = await recordFile(owner, key, written)
      .then(() => withinQuota(owner))
      .catch((error) => {
        console.error("Counting an upload failed", error);
        return null;
      });
    if (!fits) {
      await discard();
      return fits === null
        ? NextResponse.json({ error: "Upload failed" }, { status: 500 })
        : NextResponse.json({ error: quotaMessage() }, { status: 413 });
    }
  }
  return new Response(null, { status: 201 });
}
