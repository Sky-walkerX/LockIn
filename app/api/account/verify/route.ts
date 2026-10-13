import { z } from "zod";
import prisma from "@/lib/prisma";
import { emailTokenStands, redeemEmailToken } from "@/lib/accounts/email-tokens";

const Body = z.object({ token: z.string().min(1).max(200) });

const INVALID = { error: "This link is no longer valid. Sign in to have a new one sent." };

// GET /api/account/verify?token= - whether a confirmation link would still
// work. It spends nothing: mail scanners open links, and a link that confirmed
// itself when merely opened would confirm addresses nobody read the email at.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return Response.json({ valid: await emailTokenStands(token, "verify") }, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/account/verify { token } - confirm the address. The link's holder
// pressed the button on the page it opened.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json(INVALID, { status: 400 });

  const userId = await redeemEmailToken(parsed.data.token, "verify");
  if (!userId) return Response.json(INVALID, { status: 400 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
    select: { email: true },
  });
  return Response.json({ email: user.email });
}
