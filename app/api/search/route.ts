import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { likePatterns, parseTerms } from "@/lib/search/query";
import { rankHits, toHit, type SearchRow } from "@/lib/search/hits";

// Every table in one statement: through the transaction pooler each Prisma
// call pays BEGIN, DEALLOCATE ALL and COMMIT on top of the query, so one call
// per table would cost four times the round trips.
//
// A row matches when every term appears somewhere in its title or notes
// (ILIKE ALL over the term patterns). Title matches are pulled forward before
// the LIMIT so a big notes-only result set can't crowd them out; rankHits does
// the real ordering. Resources are left out on purpose: their extracted text
// can be a whole book, and Ask already searches it.
const SEARCH_SQL = `
SELECT * FROM (
  SELECT 'subject' AS kind, s.id, s.title, coalesce(s.description, '') AS notes,
         false AS "isCompleted", s.id AS "subjectId", s.title AS "subjectTitle", s.color,
         NULL AS "milestoneTitle", NULL AS "taskTitle", NULL AS "parentTitle"
  FROM "Subject" s
  WHERE s."userId" = $1
    AND (s.title || ' ' || coalesce(s.description, '')) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'milestone', m.id, m.title, m.notes, m."isCompleted", s.id, s.title, s.color,
         NULL, NULL, NULL
  FROM "Milestone" m
  JOIN "Subject" s ON s.id = m."subjectId"
  WHERE s."userId" = $1
    AND (m.title || ' ' || m.notes) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'task', t.id, t.title, coalesce(t.description, ''), t."isCompleted", s.id, s.title, s.color,
         m.title, NULL, NULL
  FROM "Task" t
  JOIN "Subject" s ON s.id = t."subjectId"
  LEFT JOIN "Milestone" m ON m.id = t."milestoneId"
  WHERE t."userId" = $1
    AND (t.title || ' ' || coalesce(t.description, '')) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'subtask', st.id, st.title, st.notes, st."isCompleted", s.id, s.title, s.color,
         m.title, t.title, p.title
  FROM "Subtask" st
  JOIN "Task" t ON t.id = st."taskId"
  JOIN "Subject" s ON s.id = t."subjectId"
  LEFT JOIN "Milestone" m ON m.id = t."milestoneId"
  LEFT JOIN "Subtask" p ON p.id = st."parentId"
  WHERE t."userId" = $1
    AND (st.title || ' ' || st.notes) ILIKE ALL ($2::text[])
) hits
ORDER BY hits.title ILIKE ALL ($2::text[]) DESC, length(hits.title)
LIMIT 60`;

// GET /api/search?q= - titles and notes (code included) across the user's
// subjects, milestones, tasks and subtasks, ranked for the search palette.
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const terms = parseTerms(request.nextUrl.searchParams.get("q") ?? "");
  if (terms.length === 0) return NextResponse.json([]);

  const rows = await prisma.$queryRawUnsafe<SearchRow[]>(SEARCH_SQL, userId, likePatterns(terms));
  return NextResponse.json(rankHits(rows.map((r) => toHit(r, terms)), terms));
}
