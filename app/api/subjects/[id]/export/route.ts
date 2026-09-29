import { type NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { loadSubjectTree } from "@/lib/subjects/load-tree";
import { subjectToMarkdown } from "@/lib/export/markdown";
import { attachment, slugify, validTimeZone } from "@/lib/export/download";

// GET /api/subjects/[id]/export?format=md|json&tz= - download one subject.
// Markdown dates are written in the reader's zone (?tz=), since the server's
// is meaningless to them.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const sp = request.nextUrl.searchParams;
  const format = sp.get("format") === "json" ? "json" : "md";
  const subject = await loadSubjectTree(userId, id);
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const name = slugify(subject.title);
  if (format === "json") {
    const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), subject }, null, 2);
    return new NextResponse(body, { headers: attachment(`${name}.json`, "application/json") });
  }
  const md = subjectToMarkdown(subject, { timeZone: validTimeZone(sp.get("tz")) });
  return new NextResponse(md, { headers: attachment(`${name}.md`, "text/markdown") });
}
