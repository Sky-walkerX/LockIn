import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { generateToken, hashToken, tokenPreview } from "@/lib/tokens";
import { TOKEN_PUBLIC_FIELDS, listTokens } from "@/lib/connections";

const CreateSchema = z.object({ name: z.string().trim().min(1).max(40) });

// GET /api/tokens - the user's agent tokens, newest first. Never the secrets.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(await listTokens(userId));
}

// POST /api/tokens { name } - create a token. The secret is in this response
// and nowhere else, ever: only its hash is stored.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Give the token a name of 1 to 40 characters", issues: parsed.error.issues }, { status: 400 });
  }

  const secret = generateToken();
  const token = await prisma.apiToken.create({
    data: { userId, name: parsed.data.name, tokenHash: hashToken(secret), preview: tokenPreview(secret) },
    select: TOKEN_PUBLIC_FIELDS,
  });
  return NextResponse.json({ ...token, secret }, { status: 201 });
}
