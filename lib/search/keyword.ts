import prisma from "@/lib/prisma";
import { likePatterns, parseTerms } from "@/lib/search/query";
import { rankHits, toHit, type SearchHit, type SearchRow } from "@/lib/search/hits";

// Every table in one statement, so a search is one round trip.
//
// A row matches when every term appears somewhere in its title or notes
// (ILIKE ALL over the term patterns). Title matches are pulled forward before
// the LIMIT so a big notes-only result set can't crowd them out; rankHits does
// the real ordering. Resources match on title, note and URL only: their
// extracted text can be a whole book, and semantic search covers it by meaning.
const SEARCH_SQL = `
SELECT * FROM (
  SELECT 'subject' AS kind, s.id, s.title, coalesce(s.description, '') AS notes,
         false AS "isCompleted", s.id AS "subjectId", s.title AS "subjectTitle", s.color,
         NULL AS "milestoneTitle", NULL AS "taskTitle", NULL AS "parentTitle", NULL::boolean AS readable
  FROM "Subject" s
  WHERE s."userId" = $1
    AND (s.title || ' ' || coalesce(s.description, '')) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'milestone', m.id, m.title, m.notes, m."isCompleted", s.id, s.title, s.color,
         NULL, NULL, NULL, NULL
  FROM "Milestone" m
  JOIN "Subject" s ON s.id = m."subjectId"
  WHERE s."userId" = $1
    AND (m.title || ' ' || m.notes) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'task', t.id, t.title, coalesce(t.description, ''), t."isCompleted", s.id, s.title, s.color,
         m.title, NULL, NULL, NULL
  FROM "Task" t
  JOIN "Subject" s ON s.id = t."subjectId"
  LEFT JOIN "Milestone" m ON m.id = t."milestoneId"
  WHERE t."userId" = $1
    AND (t.title || ' ' || coalesce(t.description, '')) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'subtask', st.id, st.title, st.notes, st."isCompleted", s.id, s.title, s.color,
         m.title, t.title, p.title, NULL
  FROM "Subtask" st
  JOIN "Task" t ON t.id = st."taskId"
  JOIN "Subject" s ON s.id = t."subjectId"
  LEFT JOIN "Milestone" m ON m.id = t."milestoneId"
  LEFT JOIN "Subtask" p ON p.id = st."parentId"
  WHERE t."userId" = $1
    AND (st.title || ' ' || st.notes) ILIKE ALL ($2::text[])

  UNION ALL
  SELECT 'resource', r.id, r.title, coalesce(r.note, ''), false, s.id, s.title, s.color,
         NULL, NULL, NULL, (r."ingestState" = 'READY' OR r.type = 'PDF')
  FROM "Resource" r
  JOIN "Subject" s ON s.id = r."subjectId"
  WHERE r."userId" = $1
    AND (r.title || ' ' || coalesce(r.note, '') || ' ' || r.url) ILIKE ALL ($2::text[])
) hits
ORDER BY hits.title ILIKE ALL ($2::text[]) DESC, length(hits.title)
LIMIT 60`;

/**
 * Titles and notes (code included) across the user's subjects, notes, tasks,
 * subtasks and resources, ranked, for the palette's /api/search.
 */
export async function searchKeyword(userId: string, query: string): Promise<SearchHit[]> {
  const terms = parseTerms(query);
  if (terms.length === 0) return [];
  const rows = await prisma.$queryRawUnsafe<SearchRow[]>(SEARCH_SQL, userId, likePatterns(terms));
  return rankHits(rows.map((r) => toHit(r, terms)), terms);
}
