import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";

const RenameSchema = z.object({ title: z.string().trim().min(1).max(120) });

// PUT /api/chapters/[id] - rename a chapter.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = RenameSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  // Chapters carry no userId; ownership is enforced through the subject.
  const { count } = await prisma.chapter.updateMany({ where: { id, subject: { userId } }, data: { title: parsed.data.title } });
  if (count === 0) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  return NextResponse.json(await prisma.chapter.findUnique({ where: { id } }));
}

// DELETE /api/chapters/[id] - remove a chapter. Its notes stay in the subject,
// in no chapter (the relation sets their chapterId to null).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.chapter.deleteMany({ where: { id, subject: { userId } } });
  if (count === 0) return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
