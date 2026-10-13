import { after } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { mailConfigured } from "@/lib/mail";
import { sendVerification } from "@/lib/accounts/emails";
import { NO_ACCOUNT_HASH, PASSWORD_MAX, appOrigin, normalizeEmail, userByEmail } from "@/lib/accounts/policy";
import { clientAddress, countPasswordTry, tooMany } from "@/lib/limits/rate";

const Body = z.object({ email: z.email().max(254), password: z.string().min(1).max(PASSWORD_MAX) });

// POST /api/account/verify/resend { email, password } - send the confirmation
// link again. It's offered on the sign-in page after a correct password was
// turned away for an unconfirmed address, so it asks for the same two things
// and can't be used to mail an address the caller doesn't hold an account for.
//
// It checks a password, so it must not be a second place to guess one. Each
// call counts as a sign-in try, against the same limits. And the answer is
// the same whatever happened, as quickly: the email goes out after the reply,
// so neither the reply nor how long it took says whether the password was right.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter your email and password" }, { status: 400 });
  if (!mailConfigured()) return Response.json({ error: "This notebook doesn't send email" }, { status: 503 });
  const limit = await countPasswordTry(normalizeEmail(parsed.data.email), clientAddress(request.headers));
  if (limit) return tooMany(limit, "Too many requests");

  const user = await userByEmail(parsed.data.email);
  const matches = await bcrypt.compare(parsed.data.password, user?.password ?? NO_ACCOUNT_HASH);
  if (user?.password && !user.emailVerifiedAt && matches) {
    const origin = appOrigin(request);
    after(() => sendVerification(user, origin).catch((error) => console.error("Sending the confirmation email failed", error)));
  }
  return Response.json({ sent: true });
}
