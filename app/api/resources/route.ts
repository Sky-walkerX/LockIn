import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { takePage } from "@/lib/notes/page";
import { z } from "zod";
import * as f from "@/lib/http/fields";

const ResourceSchema = z.object({
  subjectId: f.id,
  type: z.enum(["LINK", "AI_CHAT", "PDF", "BOOK"]),
  url: f.url,
  title: f.title,
  note: f.blurb.optional(),
});

// GET /api/resources?subjectId=... - resources for a subject (or all the user's)
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjectId = request.nextUrl.searchParams.get("subjectId");
  const resources = await prisma.resource.findMany({
    where: { userId, ...(subjectId ? { subjectId } : {}) },
    orderBy: { createdAt: "desc" },
    // The extracted document can run to megabytes; the reader fetches it on its own.
    omit: { extracted: true },
  });
  return NextResponse.json(resources);
}

// POST /api/resources - save a link / AI chat / PDF / book reference
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ResourceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  // Ownership: the subject must belong to the user.
  const subject = await prisma.subject.findFirst({ where: { id: parsed.data.subjectId, userId } });
  if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

  const resource = await prisma.resource.create({ data: { ...parsed.data, userId, page: await takePage(userId) } });
  return NextResponse.json(resource, { status: 201 });
}
