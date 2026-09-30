import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { chunkSourcesOf } from "@/lib/notes/move";

const MoveSchema = z.object({ subjectId: z.string().min(1) });

// POST /api/milestones/[id]/move - file a note under another subject (or the
// Inbox). Its tasks go with it, it lands at the end of the target's notes, and
// its indexed chunks are dropped so they rebuild under the new subject.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = MoveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const { subjectId } = parsed.data;

  const [note, target, last] = await Promise.all([
    prisma.milestone.findFirst({
      where: { id, subject: { userId } },
      select: {
        id: true,
        subjectId: true,
        tasks: { select: { id: true, subtasks: { select: { id: true, children: { select: { id: true } } } } } },
      },
    }),
    prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } }),
    prisma.milestone.findFirst({ where: { subjectId }, orderBy: { order: "desc" }, select: { order: true } }),
  ]);
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (!target) return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  if (note.subjectId === subjectId) {
    return NextResponse.json(await prisma.milestone.findUnique({ where: { id } }));
  }

  const chunks = chunkSourcesOf(note);
  const [moved] = await prisma.$transaction([
    prisma.milestone.update({ where: { id }, data: { subjectId, order: last ? last.order + 1 : 0 } }),
    prisma.task.updateMany({ where: { milestoneId: id }, data: { subjectId } }),
    prisma.noteChunk.deleteMany({
      where: { userId, OR: chunks.map((c) => ({ source: c.source, sourceId: { in: c.ids } })) },
    }),
  ]);
  return NextResponse.json(moved);
}
