import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { markPickedUp } from "@/lib/handoff/store";
import { WEB_SOURCE } from "@/lib/notes/source";

// DELETE /api/handoffs/[id] - the user closes an open baton: nobody needs to pick it up.
// It stays in the history, as taken by the user.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await markPickedUp(userId, id, WEB_SOURCE))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
