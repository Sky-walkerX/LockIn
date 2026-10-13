import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { mailConfigured } from "@/lib/mail";
import { sendVerification } from "@/lib/accounts/emails";
import { PASSWORD_MAX, appOrigin, normalizeEmail } from "@/lib/accounts/policy";

const Body = z.object({ email: z.email().max(254), password: z.string().min(1).max(PASSWORD_MAX) });

// POST /api/account/verify/resend { email, password } - send the confirmation
// link again. It's offered on the sign-in page after a correct password was
// turned away for an unconfirmed address, so it asks for the same two things
// and can't be used to mail an address the caller doesn't hold an account for.
// The answer is the same whatever happened.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter your email and password" }, { status: 400 });
  if (!mailConfigured()) return Response.json({ error: "This notebook doesn't send email" }, { status: 503 });

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizeEmail(parsed.data.email), mode: "insensitive" } },
    select: { id: true, email: true, password: true, emailVerifiedAt: true },
  });
  if (user?.password && !user.emailVerifiedAt && (await bcrypt.compare(parsed.data.password, user.password))) {
    try {
      await sendVerification(user, appOrigin(request));
    } catch (error) {
      console.error("Sending the confirmation email failed", error);
      return Response.json({ error: "The confirmation email couldn't be sent. Try again in a minute." }, { status: 502 });
    }
  }
  return Response.json({ sent: true });
}
