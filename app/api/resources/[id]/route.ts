import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";
import { deleteObject, keyFromUrl, ownerOfKey } from "@/lib/storage";
import { forgetFile } from "@/lib/storage/quota";
import * as f from "@/lib/http/fields";

const UpdateResourceSchema = z.object({
  type: z.enum(["LINK", "AI_CHAT", "PDF", "BOOK"]).optional(),
  url: f.url.optional(),
  title: f.title.optional(),
  note: f.blurb.nullable().optional(),
});

// PUT /api/resources/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateResourceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.resource.updateMany({ where: { id, userId }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resource = await prisma.resource.findUnique({ where: { id }, omit: { extracted: true } });
  return NextResponse.json(resource);
}

// DELETE /api/resources/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const resource = await prisma.resource.findFirst({ where: { id, userId }, select: { url: true } });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.resource.deleteMany({ where: { id, userId } });

  // A PDF the user uploaded goes with its resource, and its space comes back.
  // Only a file in the user's own folder, and only if nothing else of theirs
  // still points at it.
  const key = keyFromUrl(resource.url);
  if (key && ownerOfKey(key) === userId && (await prisma.resource.count({ where: { userId, url: resource.url } })) === 0) {
    await deleteObject(key).catch((error) => console.error("Removing a deleted resource's file failed", error));
    await forgetFile(key);
  }
  return NextResponse.json({ success: true });
}
