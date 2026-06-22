import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const UpdateResourceSchema = z.object({
  type: z.enum(["LINK", "AI_CHAT", "PDF", "BOOK"]).optional(),
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  note: z.string().nullable().optional(),
});

// PUT /api/resources/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateResourceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const { count } = await prisma.resource.updateMany({ where: { id, userId }, data: parsed.data });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const resource = await prisma.resource.findUnique({ where: { id } });
  return NextResponse.json(resource);
}

// DELETE /api/resources/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.resource.deleteMany({ where: { id, userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
