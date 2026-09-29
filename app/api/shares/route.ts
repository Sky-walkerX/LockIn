import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { mintToken, ownsEntity } from "@/lib/share/load";

const TargetSchema = z.object({
  type: z.enum(["SUBJECT", "MILESTONE", "TASK", "SUBTASK"]),
  entityId: z.string().min(1),
});

/** Read `?type=&entityId=` into the same shape the POST body uses. */
function targetFromQuery(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  return TargetSchema.safeParse({ type: q.get("type"), entityId: q.get("entityId") });
}

// GET /api/shares?type=&entityId= — the live share for one record, or null.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = targetFromQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid target", issues: parsed.error.issues }, { status: 400 });
  }
  const { type, entityId } = parsed.data;

  // Scope by userId as well as the target: without it, anyone could probe
  // whether someone else's record is shared, and read its token.
  const share = await prisma.share.findFirst({
    where: { type, entityId, userId },
    select: { token: true, createdAt: true },
  });
  return NextResponse.json({ share });
}

// POST /api/shares — start sharing a record, or return the link it already has.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = TargetSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid target", issues: parsed.error.issues }, { status: 400 });
  }
  const { type, entityId } = parsed.data;

  if (!(await ownsEntity(type, entityId, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotent: re-sharing a record returns its existing token rather than
  // minting a second live link to the same content. `update` on conflict keeps
  // the row's owner correct without a read-then-write race.
  const share = await prisma.share.upsert({
    where: { type_entityId: { type, entityId } },
    create: { type, entityId, userId, token: mintToken() },
    update: {},
    select: { token: true, createdAt: true },
  });
  return NextResponse.json({ share }, { status: 201 });
}

// DELETE /api/shares?type=&entityId= — revoke; the link dies immediately.
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = targetFromQuery(request);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid target", issues: parsed.error.issues }, { status: 400 });
  }
  const { type, entityId } = parsed.data;

  await prisma.share.deleteMany({ where: { type, entityId, userId } });
  // Deleting an already-unshared record is a no-op, not an error: the caller
  // asked for "not shared", and that is the state either way.
  return NextResponse.json({ success: true });
}
