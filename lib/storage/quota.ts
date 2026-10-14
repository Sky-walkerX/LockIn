import prisma from "@/lib/prisma";
import { BUCKETS, deleteObject, storageDriver, storedSize } from "@/lib/storage";

// How much a notebook may store. Files are public by their unguessable URL
// (lib/storage), so without a ceiling an account is free file hosting for
// whoever makes one. Each stored file's size is recorded as it arrives and
// the total is held against the quota.
//
// STORAGE_QUOTA_MB sets the ceiling per account (1024 unless set); 0 lifts it.

const DEFAULT_QUOTA_MB = 1024;

// The largest PDF taken. Mirrors service/app/config.py's MAX_DOWNLOAD_BYTES: a
// file too large for the parser to fetch is a file too large to accept.
export const MAX_PDF_BYTES = 50 * 1024 * 1024;

// How long a Supabase upload link goes on working. Supabase sets it, at two
// hours, and has no way to cancel one. A little is added for clocks that differ.
const LINK_LIFE_MS = (2 * 60 + 5) * 60 * 1000;

/** Bytes one account may store, or Infinity when the instance sets no ceiling. */
export function storageQuota(): number {
  const raw = process.env.STORAGE_QUOTA_MB?.trim();
  const mb = raw === undefined || raw === "" ? DEFAULT_QUOTA_MB : Number(raw);
  if (!Number.isFinite(mb) || mb < 0) return DEFAULT_QUOTA_MB * 1024 * 1024;
  return mb === 0 ? Infinity : mb * 1024 * 1024;
}

/** Bytes this account has stored. */
export async function storageUsed(userId: string): Promise<number> {
  const sum = await prisma.storedFile.aggregate({ where: { userId }, _sum: { bytes: true } });
  return sum._sum.bytes ?? 0;
}

/** Whether `bytes` more would still fit. */
export async function fitsQuota(userId: string, bytes: number): Promise<boolean> {
  const quota = storageQuota();
  if (quota === Infinity) return true;
  return (await storageUsed(userId)) + bytes <= quota;
}

/**
 * Whether what's recorded is within the quota. Asking "would it fit?" before a
 * file arrives isn't enough on its own: uploads started in the same moment are
 * each told yes. So a file is recorded when it arrives and this is asked
 * after, when each of them can see the others.
 */
export async function withinQuota(userId: string): Promise<boolean> {
  return (await storageUsed(userId)) <= storageQuota();
}

/** "This notebook's storage is full (1024 MB)…", for the 413 an upload gets. */
export function quotaMessage(): string {
  return `This notebook's storage is full (${Math.round(storageQuota() / 1024 / 1024)} MB). Delete a PDF you no longer need to make room.`;
}

/** Notes that a file now exists under this account, and how big it is. */
export async function recordFile(userId: string, key: string, bytes: number): Promise<void> {
  await prisma.storedFile.upsert({ where: { key }, create: { key, userId, bytes }, update: { bytes } });
}

// A PDF in Supabase is uploaded by the browser, through a link that can't be
// held to a size and can't be cancelled. So while a link could still be used,
// room for the largest file it allows is held under its key, whatever is
// there now.
const linksToSupabase = (key: string) => storageDriver() === "supabase" && key.startsWith(`${BUCKETS.docs}/`);
const linkBornBefore = () => new Date(Date.now() - LINK_LIFE_MS);

/**
 * Holds room for a PDF the browser is about to upload to Supabase. The room
 * held is the most the link allows; saving the resource settles it at the
 * file's real size (settleUpload). Held first and checked second, so links
 * asked for in the same moment can't each be told there's space. False when
 * a file of `size` wouldn't fit, and then nothing stays held.
 */
export async function holdUpload(userId: string, key: string, size: number): Promise<boolean> {
  await settleOldHolds(userId);
  await recordFile(userId, key, MAX_PDF_BYTES);
  if ((await storageUsed(userId)) - MAX_PDF_BYTES + size <= storageQuota()) return true;
  await releaseHold(key);
  return false;
}

/** Lets go of room held for a link that was never handed out. */
export async function releaseHold(key: string): Promise<void> {
  await prisma.storedFile.deleteMany({ where: { key } });
}

/**
 * Room still held for a link that has run out is settled: at the file's size
 * if one arrived, let go if none did. Without this, a link that was never
 * used would hold its room for good.
 */
async function settleOldHolds(userId: string): Promise<void> {
  if (storageDriver() !== "supabase") return;
  const held = await prisma.storedFile.findMany({
    where: { userId, bytes: MAX_PDF_BYTES, key: { startsWith: `${BUCKETS.docs}/` }, createdAt: { lt: linkBornBefore() } },
    select: { key: true },
    take: 20,
  });
  await Promise.all(
    held.map(async ({ key }) => {
      const bytes = await storedSize(key);
      if (bytes === "gone") await releaseHold(key);
      else if (bytes !== null && bytes !== MAX_PDF_BYTES) await prisma.storedFile.updateMany({ where: { key }, data: { bytes } });
    }),
  );
}

/**
 * Settles a PDF the browser uploaded to Supabase directly: it was counted at
 * the most its link allows, and here it's counted at what it is. False when
 * that puts the account over its quota: the file is removed.
 * A file that never gets this far stays counted at the most, which is the
 * point: saying "1 byte" and uploading 50 MB costs 50 MB.
 */
export async function settleUpload(userId: string, key: string): Promise<boolean> {
  const bytes = await storedSize(key);
  // Not there, or no telling: the room stays held.
  if (typeof bytes !== "number") return true;
  await recordFile(userId, key, bytes);
  if (await withinQuota(userId)) return true;
  await removeFile(key, "Removing a file over quota failed");
  return false;
}

/**
 * Removes a stored file and stops counting it. A file that couldn't be
 * removed is still there, so it's still counted.
 */
export async function removeFile(key: string, onFailure: string): Promise<void> {
  try {
    await deleteObject(key);
  } catch (error) {
    console.error(onFailure, error);
    return;
  }
  await forgetFile(key);
}

/**
 * Forgets a file that has been removed. A PDF in Supabase whose upload link
 * still works could be put straight back, uncounted, so its room goes back to
 * being held instead, and is let go once the link has run out.
 */
export async function forgetFile(key: string): Promise<void> {
  if (linksToSupabase(key)) {
    const held = await prisma.storedFile.updateMany({ where: { key, createdAt: { gt: linkBornBefore() } }, data: { bytes: MAX_PDF_BYTES } });
    if (held.count > 0) return;
  }
  await prisma.storedFile.deleteMany({ where: { key } });
}
