import prisma from "@/lib/prisma";
import { publicOrigin } from "@/lib/http/origin";

// What whoever runs this instance decided about accounts.

/** SIGNUP=closed stops new accounts; anything else leaves sign-up open. */
export function signupOpen(): boolean {
  return process.env.SIGNUP?.trim().toLowerCase() !== "closed";
}

/**
 * Whether a new account may be created now. A closed instance still lets the
 * first one in, so setting SIGNUP=closed before the first start doesn't lock
 * its owner out.
 */
export async function canCreateAccount(): Promise<boolean> {
  if (signupOpen()) return true;
  return (await prisma.user.count()) === 0;
}

/**
 * The address the app is opened at, for links in emails. Only a configured
 * one will do: NEXTAUTH_URL (which Docker sets from PUBLIC_URL), or the
 * production domain Vercel names. A link built from the request's own Host
 * header could be made to point at someone else's site by whoever sent the
 * request, and the link carries a token. Outside production the request's
 * address is used, so local development needs no setting.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set NEXTAUTH_URL to the address LockIn is opened at; without it no email link can be built safely.");
  }
  return publicOrigin(request);
}

/** Addresses are compared and stored in lower case, so Ada@ and ada@ are one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * The account with this address, by exact match on the lower-cased address.
 * Never a case-insensitive match: that's a pattern match in Postgres, where
 * "_" stands for any character, so john_doe@ would find johnadoe@'s account.
 */
export function userByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

// A real bcrypt hash of nothing anyone knows. A password checked for an
// address with no account is compared with this, so the check takes as long
// as one for an address with an account and its timing doesn't tell them apart.
export const NO_ACCOUNT_HASH = "$2b$10$0UK33LcR0DfZNIzpN/yahOhMb9oUs7.RSTINW1fWBqmu1ICNloUD2";

export const PASSWORD_MIN = 8;
// bcrypt reads 72 bytes; the cap only stops someone posting a megabyte to hash.
export const PASSWORD_MAX = 200;
