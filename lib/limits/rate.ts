import prisma from "@/lib/prisma";

// Limits on how often something can be done, for the doors that have no agent
// token to count against: signing in, signing up, asking for an email, an
// app registering itself. Counted in Postgres, in one statement per check, so
// it needs no other service and holds across every instance of the app.
//
// RATE_LIMITS=off turns all of it off, for whoever runs LockIn behind
// something that already does this.

export type Limit = { ok: boolean; /** Seconds until the window ends. */ retryAfter: number };

const off = () => process.env.RATE_LIMITS?.trim().toLowerCase() === "off";

/**
 * Counts one more `key` in its window and says whether it's still within
 * `limit`. A window starts at the first count and lasts `windowSeconds`; the
 * next count after that starts a new one. Times are UTC, as Prisma stores them.
 */
export async function countAgainst(key: string, limit: number, windowSeconds: number): Promise<Limit> {
  if (off()) return { ok: true, retryAfter: 0 };
  const [row] = await prisma.$queryRaw<{ count: number; retryAfter: number }[]>`
    INSERT INTO "RateLimit" AS r ("key", "windowStart", "count")
    VALUES (${key}, (now() AT TIME ZONE 'UTC'), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN r."windowStart" > (now() AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}) THEN r."count" + 1 ELSE 1 END,
      "windowStart" = CASE WHEN r."windowStart" > (now() AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}) THEN r."windowStart" ELSE (now() AT TIME ZONE 'UTC') END
    RETURNING r."count",
      CEIL(EXTRACT(EPOCH FROM r."windowStart" + make_interval(secs => ${windowSeconds}) - (now() AT TIME ZONE 'UTC')))::int AS "retryAfter"`;
  // Old rows are swept now and then, by whichever request draws the short straw.
  if (Math.random() < 0.01) void sweep();
  return { ok: row.count <= limit, retryAfter: Math.max(1, Number(row.retryAfter)) };
}

/** Rows whose window ended more than a day ago count nothing any more. */
async function sweep(): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < (now() AT TIME ZONE 'UTC') - interval '1 day'`.catch(() => {});
}

/** The reply for a caller over a limit: 429, and how long to wait. */
export function tooMany(limit: Limit, what = "Too many requests"): Response {
  return Response.json(
    { error: `${what}. Try again in ${wait(limit.retryAfter)}.` },
    { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
  );
}

/** "40 seconds", "12 minutes": how long, the way a person would say it. */
export function wait(seconds: number): string {
  if (seconds < 90) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minutes`;
}

/**
 * Counts one guess at an account's password, wherever it's made: signing in,
 * or asking for the confirmation link again, which checks the same password.
 * Guessing is slowed three ways: per address from one network (the usual
 * case), per network across addresses, and per address across networks, which
 * is loose enough that a stranger can't lock someone out of their own notebook
 * by guessing at it. Returns the limit that was passed, or null.
 */
export async function countPasswordTry(email: string, address: string): Promise<Limit | null> {
  const tries = await Promise.all([
    countAgainst(`login:${email}:${address}`, 10, 10 * 60),
    countAgainst(`login-from:${address}`, 100, 10 * 60),
    countAgainst(`login:${email}`, 200, 60 * 60),
  ]);
  return tries.find((t) => !t.ok) ?? null;
}

/**
 * The address a request came from, for limits on people who aren't signed in.
 * Only a proxy's word for it can be believed: each proxy adds the address it
 * saw to the end of X-Forwarded-For, so the last entry is what the nearest
 * proxy saw and anything before it is whatever the caller chose to send.
 * TRUSTED_PROXY_HOPS says how many proxies stand in front (1 unless set): the
 * address is that many entries from the end. With no such header there is no
 * address to go on, and everyone shares one count.
 *
 * 0 is for a LockIn that visitors reach directly. Then the whole header is the
 * caller's to write, a fresh address per request if they like, so none of it
 * is believed and everyone shares one count again.
 */
export function clientAddress(headers: Headers): string {
  const set = Number(process.env.TRUSTED_PROXY_HOPS?.trim() || 1);
  const hops = Number.isInteger(set) && set >= 0 ? set : 1;
  if (hops === 0) return "unknown";
  const seen = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return seen[seen.length - hops] ?? seen[0] ?? "unknown";
}
