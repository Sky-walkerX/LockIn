import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
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
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const name = BUCKETS[bucket];
  const key = `${name}/${objectPath}`;
  if (storageDriver() === "local") {
    const { exp, max, sig } = signUpload(key, maxBytes);
    const q = new URLSearchParams({ key, exp: String(exp), max: String(max), sig });
    return { uploadUrl: `${origin}/api/files/upload?${q}`, publicUrl: `${origin}/api/files/${key}` };
  }

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
