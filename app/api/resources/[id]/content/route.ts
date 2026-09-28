import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

// GET /api/resources/[id]/content - a resource with its extracted text, for
// the reader. The only route that sends `extracted`; lists and the subject
// tree leave it out.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const resource = await prisma.resource.findFirst({
    where: { id, userId },
    select: {
      id: true,
      subjectId: true,
      type: true,
      title: true,
      url: true,
      extracted: true,
      pageCount: true,
      ingestState: true,
      ingestError: true,
    },
  });
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(resource);
}
