import prisma from "@/lib/prisma";

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
  if (!state.exists) return false;
  if (state.changedAt === null) return true;
  return typeof signedInAt === "number" && signedInAt >= state.changedAt;
}

/** Drop what's remembered about an account that just changed or went. */
export function forgetAccount(userId: string): void {
  kept.delete(userId);
}
