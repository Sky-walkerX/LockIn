import prisma from "@/lib/prisma";
import { BUCKETS, keyFromUrl, ownerOfKey, putObject } from "@/lib/storage";
import { fitsQuota, recordFile, removeFile, withinQuota } from "@/lib/storage/quota";
import { configuredOrigin } from "./policy";

// A profile photo: one small square image, stored with the user's other files
// and counted against their storage like them. The browser crops and shrinks
// it before it's sent (Settings), so it arrives as a 256px square; the limit
// here is for anything that skips that.

export const PHOTO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
export const MAX_PHOTO_BYTES = 1024 * 1024;

/**
 * Stores a photo and makes it the account's, removing the one it replaces.
 * Returns its address, or null when it doesn't fit in the user's storage.
 * The caller has checked the type and size.
 */
export async function storePhoto(userId: string, file: Blob, origin: string): Promise<string | null> {
  if (!(await fitsQuota(userId, file.size))) return null;
  const objectPath = `${userId}/photo-${crypto.randomUUID()}.${PHOTO_TYPES[file.type]}`;
  const key = `${BUCKETS.notes}/${objectPath}`;
  const url = await putObject("notes", objectPath, file, origin);
  // From here the file is removed again unless it becomes the photo, whether
  // there turns out to be no room (asked again now that it's counted, as for
  // any upload), the account is gone, or the database fails.
  let kept = false;
  try {
    await recordFile(userId, key, file.size);
    kept = (await withinQuota(userId)) && (await swapPhoto(userId, url));
  } finally {
    if (!kept) await removeFile(key, "Removing a profile photo that couldn't be kept failed");
  }
  return kept ? url : null;
}

/** Takes the photo away, and removes its file. */
export async function clearPhoto(userId: string): Promise<void> {
  await swapPhoto(userId, null);
}

/**
 * Sets the account's photo and removes the file of the one it had. The row is
 * held from reading the old address to writing the new one, so two uploads at
 * once each replace the other's, and no file is left that nothing points to.
 * False when the account is gone.
 */
async function swapPhoto(userId: string, url: string | null): Promise<boolean> {
  const previous = await prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<{ image: string | null }[]>`
      SELECT "image" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    if (!row) return undefined;
    await tx.user.update({ where: { id: userId }, data: { image: url } });
    return row.image;
  });
  if (previous === undefined) return false;
  const old = previous ? keyFromUrl(previous) : null;
  if (old && ownerOfKey(old) === userId) await removeFile(old, "Removing a replaced profile photo failed");
  return true;
}

// Google's profile photos, and nowhere else: the address comes from Google's
// answer at sign-in, but it's fetched from the server, so it's checked first.
const GOOGLE_PHOTO = /^https:\/\/lh\d+\.googleusercontent\.com\//;

/**
 * At a Google sign-in, an account with no photo gets a copy of the Google
 * one, so it shows even if it later changes or goes on Google's side. Asked
 * at 256px. Never throws: a sign-in doesn't depend on it.
 */
export async function copyGooglePhoto(userId: string, picture: unknown): Promise<void> {
  try {
    const origin = configuredOrigin();
    if (typeof picture !== "string" || !GOOGLE_PHOTO.test(picture) || !origin) return;
    const res = await fetch(picture.replace(/=s\d+(-c)?$/, "=s256-c"), { signal: AbortSignal.timeout(5000), redirect: "error" });
    const type = res.headers.get("content-type")?.split(";")[0].trim() ?? "";
    if (!res.ok || !PHOTO_TYPES[type] || Number(res.headers.get("content-length") ?? 0) > MAX_PHOTO_BYTES) return;
    const photo = new Blob([await res.arrayBuffer()], { type });
    if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) return;
    // One chosen in the meantime wins.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
    if (!user || user.image) return;
    await storePhoto(userId, photo, origin);
  } catch (error) {
    console.error("Copying a Google profile photo failed", error);
  }
}
