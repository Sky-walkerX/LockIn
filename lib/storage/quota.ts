import prisma from "@/lib/prisma";
import { deleteObject, storedSize } from "@/lib/storage";

// How much a notebook may store. Files are public by their unguessable URL
// (lib/storage), so without a ceiling an account is free file hosting for
// whoever makes one. Each stored file's size is recorded as it arrives and
// the total is held against the quota.
//
// STORAGE_QUOTA_MB sets the ceiling per account (1024 unless set); 0 lifts it.

const DEFAULT_QUOTA_MB = 1024;

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

/** "This notebook's storage is full (1024 MB)…", for the 413 an upload gets. */
export function quotaMessage(): string {
  return `This notebook's storage is full (${Math.round(storageQuota() / 1024 / 1024)} MB). Delete a PDF you no longer need to make room.`;
}

/** Notes that a file now exists under this account, and how big it is. */
export async function recordFile(userId: string, key: string, bytes: number): Promise<void> {
  await prisma.storedFile.upsert({ where: { key }, create: { key, userId, bytes }, update: { bytes } });
}

/**
 * Settles a PDF the browser uploaded to Supabase directly. Supabase's upload
 * link can't be held to a size, so the file was counted at the most it could
 * be when the link was made; here it's counted at what it is. False when that
 * puts the account over its quota: the file is removed.
 * A file that never gets this far stays counted at the ceiling, which is the
 * point: saying "1 byte" and uploading 50 MB costs 50 MB.
 */
export async function settleUpload(userId: string, key: string): Promise<boolean> {
  const bytes = await storedSize(key);
  if (bytes === null) return true;
  await recordFile(userId, key, bytes);
  if ((await storageUsed(userId)) <= storageQuota()) return true;
  await deleteObject(key).catch((error) => console.error("Removing a file over quota failed", error));
  await forgetFile(key);
  return false;
}

/** Forgets a file that has been removed. */
export async function forgetFile(key: string): Promise<void> {
  await prisma.storedFile.deleteMany({ where: { key } });
}
