import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { z } from "zod";
import * as f from "@/lib/http/fields";

const ChapterSchema = z.object({
  subjectId: f.id,
  title: z.string().trim().min(1).max(120),
});

// POST /api/chapters - a new chapter at the end of a subject's chapters. The
// Inbox has none: what's there is waiting to be filed.
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ChapterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { subjectId, title } = parsed.data;

  const [subject, last] = await Promise.all([
    prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { isInbox: true } }),
    prisma.chapter.findFirst({ where: { subjectId }, orderBy: { order: "desc" }, select: { order: true } }),
  ]);
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  if (subject.isInbox) return NextResponse.json({ error: "The Inbox doesn't have chapters" }, { status: 400 });

  const chapter = await prisma.chapter.create({ data: { subjectId, title, order: last ? last.order + 1 : 0 } });
  return NextResponse.json(chapter, { status: 201 });
}
