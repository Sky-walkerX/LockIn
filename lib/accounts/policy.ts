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
 * The address the app is opened at, for links in emails. The configured one
 * (NEXTAUTH_URL, which Docker sets from PUBLIC_URL) comes first: a link built
 * from the request's own Host header could be made to point at someone else's
 * site by whoever sent the request.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "");
  return configured || publicOrigin(request);
}

/** Addresses are compared and stored in lower case, so Ada@ and ada@ are one account. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const PASSWORD_MIN = 8;
// bcrypt reads 72 bytes; the cap only stops someone posting a megabyte to hash.
export const PASSWORD_MAX = 200;
