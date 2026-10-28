import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Where note images and uploaded PDFs live. Two backends:
//   supabase  Supabase Storage, for the hosted instance (SUPABASE_URL and
//             SUPABASE_SERVICE_ROLE_KEY set). Public buckets, uuid paths.
//   local     A folder on disk (STORAGE_DIR), served by /api/files. The
//             default when Supabase isn't configured, i.e. self-hosted.
// Both are public-by-unguessable-path: markdown <img> tags can't send auth
// headers, and the ingest service fetches PDFs by URL.

export const BUCKETS = { notes: "lockin-notes", docs: "lockin-docs" } as const;
export type Bucket = keyof typeof BUCKETS;

export const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

/** The image types a note may hold, by MIME type, with the extension each is stored under. */
export const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** The largest image an agent may upload into a note: room for a Retina screenshot. */
export const MAX_NOTE_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Whether a file's first bytes are what its extension claims. Stored files
 * are served under their extension's type, so a `.png` has to be a PNG.
 * Only images are checked; anything else passes.
 */
export function looksLike(ext: string, head: Uint8Array): boolean {
  const starts = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  switch (ext) {
    case "png":
      return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "jpg":
      return starts(0xff, 0xd8, 0xff);
    case "gif":
      return starts(0x47, 0x49, 0x46, 0x38);
    case "webp":
      return starts(0x52, 0x49, 0x46, 0x46) && [0x57, 0x45, 0x42, 0x50].every((b, i) => head[8 + i] === b);
    default:
      return true;
  }
}

export function storageDriver(): "supabase" | "local" {
  const forced = process.env.STORAGE_DRIVER;
  if (forced === "local" || forced === "supabase") return forced;
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local";
}

/** `<bucket>/<userId>/<uuid>.<ext>`: the only shape a stored key can take. */
const KEY_RE = /^(lockin-notes|lockin-docs)\/[A-Za-z0-9-]{1,64}\/[A-Za-z0-9-]{1,64}\.(png|jpg|gif|webp|pdf)$/;

export function isValidKey(key: string): boolean {
  return KEY_RE.test(key);
}

// A folder chosen at run time (STORAGE_DIR), not part of the app: told to
// Turbopack so the build doesn't trace the whole project into the server.
export function storageDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage"));
}

/** Absolute path on disk for a key, or null if the key isn't one we write. */
export function localPath(key: string): string | null {
  if (!isValidKey(key)) return null;
  const root = storageDir();
  const full = path.resolve(root, key);
  return full.startsWith(root + path.sep) ? full : null;
}

// ── Signed upload tokens (local driver) ───────────────────────────────────
// The browser PUTs a PDF straight to /api/files/upload with a token that
// names the one key it may write, its size cap and an expiry, signed with
// AUTH_SECRET. The route checks the signature; nothing else is trusted.

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(key: string, exp: number, max: number): string {
  return createHmac("sha256", secret()).update(`${key}|${exp}|${max}`).digest("base64url");
}

export function signUpload(key: string, max: number, ttlSeconds = 15 * 60): { exp: number; max: number; sig: string } {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return { exp, max, sig: sign(key, exp, max) };
}

export function verifyUpload(key: string, exp: number, max: number, sig: string): boolean {
  if (!isValidKey(key) || !Number.isFinite(exp) || !Number.isFinite(max)) return false;
  if (exp < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(sign(key, exp, max));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ── Operations ────────────────────────────────────────────────────────────

function supabase() {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { base, key };
}

async function ensureSupabaseBucket(bucket: string, fileSizeLimit?: number) {
  const { base, key } = supabase();
  await fetch(`${base}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true, ...(fileSizeLimit ? { fileSizeLimit } : {}) }),
  }).catch(() => {});
}

/** Store a file the server already holds (a pasted image). Returns its public URL. */
export async function putObject(bucket: Bucket, objectPath: string, body: Blob, origin: string): Promise<string> {
  const name = BUCKETS[bucket];
  const key = `${name}/${objectPath}`;
  if (storageDriver() === "local") {
    const full = localPath(key);
    if (!full) throw new Error("Invalid storage key");
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, Buffer.from(await body.arrayBuffer()));
    return `${origin}/api/files/${key}`;
  }

  const { base, key: token } = supabase();
  const upload = () =>
    fetch(`${base}/storage/v1/object/${name}/${objectPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": body.type,
        "Cache-Control": "max-age=31536000, immutable", // uuid path never changes
      },
      body,
    });
  let res = await upload();
  if (!res.ok && /bucket not found/i.test(await res.clone().text())) {
    // First upload ever: create the public bucket, then retry once.
    await ensureSupabaseBucket(name);
    res = await upload();
  }
  if (!res.ok) {
    console.error("Supabase Storage upload failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Upload to storage failed");
  }
  return `${base}/storage/v1/object/public/${name}/${objectPath}`;
}

/** Where a stored file can be read, by its key: the public URL each backend gives it. */
export function publicUrl(key: string, origin: string): string {
  return storageDriver() === "local"
    ? `${origin}/api/files/${key}`
    : `${supabase().base}/storage/v1/object/public/${key}`;
}

/**
 * A link to PUT one file to /api/files/upload, signed for its key and for at
 * most `size` bytes, and the public URL the file will have. The route stores
 * it on whichever backend is in use and counts it as it arrives.
 */
export function createSignedUpload(key: string, size: number, origin: string): { uploadUrl: string; publicUrl: string } {
  const { exp, max, sig } = signUpload(key, size);
  const q = new URLSearchParams({ key, exp: String(exp), max: String(max), sig });
  return { uploadUrl: `${origin}/api/files/upload?${q}`, publicUrl: publicUrl(key, origin) };
}

/**
 * Let the browser upload a large file (a PDF) directly, without passing the
 * body through a serverless function's request-size cap. Returns where to PUT
 * it and the public URL it will have.
 */
export async function createUpload(
  bucket: Bucket,
  objectPath: string,
  maxBytes: number,
  origin: string,
  /** The size the browser said the file is. The local link is signed for
   *  exactly that, so no more than was counted against the quota can arrive. */
  size: number = maxBytes,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const name = BUCKETS[bucket];
  const key = `${name}/${objectPath}`;
  if (storageDriver() === "local") return createSignedUpload(key, Math.min(maxBytes, size), origin);

  const { base, key: token } = supabase();
  const signRequest = () =>
    fetch(`${base}/storage/v1/object/upload/sign/${name}/${objectPath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    });
  let res = await signRequest();
  // A missing bucket on this endpoint comes back as a generic
  // { code: "InvalidRequest" }, not "bucket not found" (checked against
  // Supabase directly): create it, then retry once.
  if (!res.ok && (await res.clone().json().catch(() => null))?.code === "InvalidRequest") {
    await ensureSupabaseBucket(name, maxBytes);
    res = await signRequest();
  }
  if (!res.ok) {
    console.error("Supabase signed-upload-url request failed:", res.status, await res.text().catch(() => ""));
    throw new Error("Could not prepare the upload");
  }
  // `url` is a path like "/object/upload/sign/<bucket>/<path>?token=…".
  const { url: signedPath } = (await res.json()) as { url: string };
  return {
    uploadUrl: `${base}/storage/v1${signedPath}`,
    publicUrl: `${base}/storage/v1/object/public/${name}/${objectPath}`,
  };
}

/**
 * The storage key behind one of this app's own file URLs, or null for any
 * other URL (a link to somewhere else, say). Both shapes a stored file's URL
 * takes: /api/files/<key> on local disk, and Supabase's public object path.
 */
export function keyFromUrl(url: string): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  const key = pathname.match(/^\/api\/files\/(.+)$/)?.[1] ?? pathname.match(/^\/storage\/v1\/object\/public\/(.+)$/)?.[1] ?? null;
  return key && isValidKey(key) ? key : null;
}

/** The user a stored file belongs to: the folder in its key. */
export function ownerOfKey(key: string): string | null {
  return isValidKey(key) ? key.split("/")[1] : null;
}

/**
 * How big a file in Supabase Storage really is: "gone" when there's no such
 * file, null when it can't be told (and for local disk, which counts a file
 * as it arrives). The browser uploads PDFs to Supabase directly, so this is
 * the only way the server learns what arrived.
 */
export async function storedSize(key: string): Promise<number | "gone" | null> {
  if (!isValidKey(key) || storageDriver() !== "supabase") return null;
  const { base, key: token } = supabase();
  const res = await fetch(`${base}/storage/v1/object/info/${key}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
  if (!res) return null;
  const body = (await res.json().catch(() => null)) as { size?: unknown; statusCode?: unknown } | null;
  // A missing file is a 400 whose body says 404 (checked against Supabase directly).
  if (res.status === 404 || String(body?.statusCode) === "404") return "gone";
  if (!res.ok) return null;
  return typeof body?.size === "number" && Number.isFinite(body.size) ? body.size : null;
}

/**
 * Removes one stored file. Quiet when it's already gone, and throws when it
 * couldn't be removed, so that nobody stops counting a file that's still there.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!isValidKey(key)) return;
  if (storageDriver() === "local") {
    const full = localPath(key);
    if (full) await rm(full, { force: true });
    return;
  }
  const { base, key: token } = supabase();
  const res = await fetch(`${base}/storage/v1/object/${key}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok && (await storedSize(key)) !== "gone") throw new Error(`Removing a stored file failed (${res.status})`);
}

/**
 * Removes everything a user stored, when their account is deleted. Files sit
 * under `<bucket>/<userId>/`, so it's that folder in each bucket. Best effort:
 * the account goes either way, and a file that stays behind is reachable only
 * by a link nothing points to any more.
 */
export async function deleteUserFiles(userId: string): Promise<void> {
  if (!/^[A-Za-z0-9-]{1,64}$/.test(userId)) return;
  const buckets = Object.values(BUCKETS);

  if (storageDriver() === "local") {
    const root = storageDir();
    await Promise.all(buckets.map((bucket) => rm(path.join(root, bucket, userId), { recursive: true, force: true })));
    return;
  }

  const { base, key } = supabase();
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  for (const bucket of buckets) {
    // Listed and removed a page at a time until the folder is empty.
    for (let page = 0; page < 100; page++) {
      const listed = await fetch(`${base}/storage/v1/object/list/${bucket}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ prefix: `${userId}/`, limit: 1000 }),
      });
      const files = listed.ok ? ((await listed.json()) as { name: string }[]) : [];
      if (files.length === 0) break;
      const removed = await fetch(`${base}/storage/v1/object/${bucket}`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ prefixes: files.map((f) => `${userId}/${f.name}`) }),
      });
      if (!removed.ok) break;
    }
  }
}
