import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { CONTENT_TYPES, localPath, storageDriver } from "@/lib/storage";

// GET /api/files/<bucket>/<user>/<uuid>.<ext> — a stored file, when files live
// on local disk (self-hosted). Public by unguessable path, like the Supabase
// buckets it stands in for. Keys are validated against the one shape the app
// writes, so nothing outside the storage folder can be named.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (storageDriver() !== "local") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { key } = await params;
  const full = localPath(key.join("/"));
  if (!full) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ext = full.slice(full.lastIndexOf(".") + 1);
  return new Response(Readable.toWeb(createReadStream(full)) as ReadableStream, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(info.size),
      // A key never changes content: uploads always get a fresh uuid.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
