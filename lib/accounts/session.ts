import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

// Sessions are signed tokens the server doesn't store, so on their own they
// would keep working after a password change, or after the account was
// deleted, until they expired a month later. Each one is checked against the
// account instead: it stands only while the account exists and the password
// hasn't changed since the session was issued.
//
// The answer is kept for half a minute per account, so a page that makes ten
// requests asks the database once. The instance that handles a password
// change or a deletion forgets its copy at once (`forgetAccount`); any other
// instance catches up within that half minute.

const KEEP_MS = 30_000;
const MAX_KEPT = 5_000;

type Kept = { exists: boolean; changedAt: number | null; at: number };
const kept = new Map<string, Kept>();

async function accountState(userId: string): Promise<Kept> {
  const hit = kept.get(userId);
  if (hit && Date.now() - hit.at < KEEP_MS) return hit;
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } });
  const state = { exists: !!row, changedAt: row?.passwordChangedAt?.getTime() ?? null, at: Date.now() };
  if (kept.size >= MAX_KEPT) kept.clear();
  kept.set(userId, state);
  return state;
}

/**
 * Whether a session for this account still stands. `signedInAt` is when its
 * holder signed in (ms), written into the token once and never refreshed.
 * The token's own `iat` won't do: NextAuth re-issues the token, with a new
 * `iat`, every time the browser asks for its session, so an old session would
 * look new again the moment it was next used. A session from before sign-in
 * times were recorded stands until the password first changes.
 */
export async function sessionStands(userId: string, signedInAt: number | undefined): Promise<boolean> {
  const state = await accountState(userId);
  return state.exists && outlives(signedInAt, state.changedAt);
}

const outlives = (signedInAt: number | undefined, changedAt: number | null) =>
  changedAt === null || (typeof signedInAt === "number" && signedInAt >= changedAt);

/** What a transaction is given to write with. */
export type Tx = Prisma.TransactionClient;

/**
 * Holds an account still for the rest of a transaction: a password can't be
 * set on it until the transaction is over. Whatever standing access the
 * transaction hands out is then either there before the password is set, and
 * revoked with the rest (lib/connections.ts), or is asked for after, when the
 * session asking has ended.
 */
export async function holdAccount(tx: Tx, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 FROM "User" WHERE "id" = ${userId} FOR SHARE`;
}

/**
 * Runs `mint` only if the session stands at this moment, by the database's
 * word rather than what's remembered here, and holds the account still while
 * it runs. Null when the session has ended.
 *
 * For handing out access that outlives the session: an agent token, an app's
 * sign-in. The half minute for which an ended session is still believed
 * (above) is harmless for reading a page. It is not harmless here: whoever
 * was signed in when the owner reset the password could use it to make a
 * token after every token was revoked.
 */
export async function whileSessionStands<T>(userId: string, signedInAt: number | undefined, mint: (tx: Tx) => Promise<T>): Promise<T | null> {
  return prisma.$transaction(async (tx) => {
    await holdAccount(tx, userId);
    const row = await tx.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } });
    if (!row || !outlives(signedInAt, row.passwordChangedAt?.getTime() ?? null)) return null;
    return mint(tx);
  });
}

/** Drop what's remembered about an account that just changed or went. */
export function forgetAccount(userId: string): void {
  kept.delete(userId);
}
