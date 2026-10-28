import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as f from "@/lib/http/fields";
import { getUserId } from "@/lib/auth";
import { moveNote } from "@/lib/notes/write";

const MoveSchema = z.object({
  subjectId: f.id,
  // A chapter in that subject, or null for none. Left out, a note moving to
  // another subject leaves its chapter, and one staying keeps it.
  chapterId: f.id.nullable().optional(),
});

// POST /api/milestones/[id]/move - file a note under a subject (or the Inbox)
// and a chapter in it (lib/notes/write.ts moveNote).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = MoveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }
  const moved = await moveNote(userId, id, parsed.data.subjectId, parsed.data.chapterId);
  if (moved === "note-missing") return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (moved === "subject-missing") return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  if (moved === "chapter-missing") return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  return NextResponse.json(moved);
}
