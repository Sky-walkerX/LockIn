import { after } from "next/server";
import { z } from "zod";
import { mailConfigured } from "@/lib/mail";
import { sendPasswordReset } from "@/lib/accounts/emails";
import { appOrigin, userByEmail } from "@/lib/accounts/policy";
import { clientAddress, countAgainst, tooMany } from "@/lib/limits/rate";

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
  const limit = await countAgainst(`reset:${clientAddress(request.headers)}`, 10, 60 * 60);
  if (!limit.ok) return tooMany(limit, "Too many requests");

  const user = await userByEmail(parsed.data.email);
  if (user) {
    const origin = appOrigin(request);
    // Sent once the reply has gone, so the reply takes as long for an address
    // with an account as for one without. A failure to send is logged, not
    // reported: reporting it would say the address has an account.
    after(() => sendPasswordReset(user, origin).catch((error) => console.error("Sending the reset email failed", error)));
  }
  return Response.json({ sent: true });
}
