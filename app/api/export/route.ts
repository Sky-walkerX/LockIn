import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { subjectTreeInclude } from "@/lib/subjects/load-tree";
import { attachment } from "@/lib/export/download";

// GET /api/export - every subject, archived ones included, as one JSON file.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await prisma.subject.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: subjectTreeInclude,
  });

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify({ version: 1, exportedAt, subjects }, null, 2);
  return new NextResponse(body, { headers: attachment(`lockin-export-${exportedAt.slice(0, 10)}.json`, "application/json") });
}
