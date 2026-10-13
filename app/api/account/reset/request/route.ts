import { z } from "zod";
import prisma from "@/lib/prisma";
import { mailConfigured } from "@/lib/mail";
import { sendPasswordReset } from "@/lib/accounts/emails";
import { appOrigin, normalizeEmail } from "@/lib/accounts/policy";

const Body = z.object({ email: z.email().max(254) });

// POST /api/account/reset/request { email } - email a link that sets a new
// password. The answer is the same whether or not the address has an account,
// so this can't be used to find out who has one.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!mailConfigured()) {
    return Response.json({ error: "This notebook doesn't send email. Ask whoever runs it to reset your password." }, { status: 503 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalizeEmail(parsed.data.email), mode: "insensitive" } },
    select: { id: true, email: true },
  });
  if (user) {
    // A failure to send is logged, not reported: reporting it would say the address has an account.
    await sendPasswordReset(user, appOrigin(request)).catch((error) => console.error("Sending the reset email failed", error));
  }
  return Response.json({ sent: true });
}
