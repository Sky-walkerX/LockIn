import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { moveNote } from "@/lib/notes/write";

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
  const moved = await moveNote(userId, id, parsed.data.subjectId);
  if (moved === "note-missing") return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (moved === "subject-missing") return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  return NextResponse.json(moved);
}
