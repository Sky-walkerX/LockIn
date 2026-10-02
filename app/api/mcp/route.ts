import { after } from "next/server";
import { createMcpHandler, getPublicOrigin, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authenticateToken, MCP_REQUESTS_PER_MINUTE, type TokenAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { appendToNote, insertNote, placeNote } from "@/lib/notes/write";
import { pagesOf } from "@/lib/notes/page";
import { sourceLabel } from "@/lib/notes/source";
import { embedOnServer } from "@/lib/rag/ingest";
import { indexNoteOnServer } from "@/lib/rag/index-note";
import { searchKeyword } from "@/lib/search/keyword";
import { searchSemantic } from "@/lib/search/semantic";
import { formatNote, formatSearch, formatSubjects, type FoundLine } from "@/lib/mcp/format";

// The notebook's MCP server: agents (Claude Code, Codex, Cursor…) list
// subjects, search, read, save and append to the user's notes. Streamable HTTP
// at /api/mcp, stateless, authenticated by a personal access token from
// Settings. The token's name is stamped on everything an agent saves, and
// those notes wait for the user to witness them.

type Caller = { userId: string; source: string; origin: string | null };

function caller(authInfo: AuthInfo | undefined): Caller {
  const extra = authInfo?.extra as Partial<Caller> | undefined;
  if (!extra?.userId || !extra.source) throw new Error("Not authenticated");
  return { userId: extra.userId, source: extra.source, origin: extra.origin ?? null };
}

// Index a note the agent just wrote once the reply has gone, so search_notes
// finds it by meaning right away. Without the ingest service this does nothing
// and the browser indexes the note later, as it does for notes written in the app.
const indexAfterReply = (userId: string, noteId: string) =>
  after(() => indexNoteOnServer(userId, noteId).catch((e) => console.error("Indexing an agent's note failed", e)));

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const noteUrl = (origin: string | null, subjectId: string, isInbox: boolean, noteId: string) =>
  origin ? (isInbox ? `${origin}/inbox?note=${noteId}` : `${origin}/subjects/${subjectId}?note=${noteId}`) : null;

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_subjects",
      {
        title: "List subjects",
        description:
          "List the subjects (sections) in the user's notebook with how many notes each has, plus the Inbox where unfiled notes wait. Call this before save_note to pick the right subject.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async (_args, ctx) => {
        const { userId } = caller(ctx.http?.authInfo);
        const subjects = await prisma.subject.findMany({
          where: { userId, isArchived: false },
          orderBy: [{ isInbox: "asc" }, { updatedAt: "desc" }],
          select: { id: true, title: true, isInbox: true, _count: { select: { milestones: true } } },
        });
        return text(
          formatSubjects(subjects.map((s) => ({ id: s.id, title: s.title, isInbox: s.isInbox, noteCount: s._count.milestones }))),
        );
      },
    );

    server.registerTool(
      "search_notes",
      {
        title: "Search notes",
        description:
          "Search the user's notes, tasks and saved resources. Finds by meaning when the notebook's embedding service is running, and always by keyword. Returns ids to pass to get_note.",
        inputSchema: z.object({
          query: z.string().trim().min(1).max(200).describe("What to look for, in plain words"),
          limit: z.number().int().min(1).max(20).optional().describe("How many results, 8 by default"),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ query, limit = 8 }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        const found: FoundLine[] = [];
        let mode: "meaning" | "keyword" = "keyword";

        const embedded = await embedOnServer([query], "query");
        if (embedded.ok) {
          mode = "meaning";
          for (const h of await searchSemantic(userId, embedded.vectors[0], limit)) {
            found.push({ kind: h.kind, id: h.id, title: h.title, path: h.path, snippet: h.snippet, href: h.href });
          }
        }
        for (const h of await searchKeyword(userId, query)) {
          if (found.length >= limit) break;
          if (found.some((f) => f.id === h.id)) continue;
          found.push({ kind: h.kind, id: h.id, title: h.title, path: h.path, snippet: h.snippet, href: h.href });
        }
        const pages = await pagesOf(userId, found);
        for (const f of found) f.page = pages.get(f.id) ?? null;
        return text(formatSearch(query, found, origin, mode));
      },
    );

    server.registerTool(
      "get_note",
      {
        title: "Read a note",
        description: "Read one of the user's notes in full (markdown), with its subject, who wrote it and its tasks.",
        inputSchema: z.object({ id: z.string().min(1).describe("The note's id, from search_notes or save_note") }),
        annotations: { readOnlyHint: true },
      },
      async ({ id }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        const note = await prisma.milestone.findFirst({
          where: { id, subject: { userId } },
          include: {
            subject: { select: { id: true, title: true, isInbox: true } },
            tasks: { select: { title: true, isCompleted: true }, orderBy: { order: "asc" } },
          },
        });
        if (!note) return { ...text(`No note with id ${id} in this notebook.`), isError: true };
        return text(formatNote(note, noteUrl(origin, note.subject.id, note.subject.isInbox, note.id)));
      },
    );

    server.registerTool(
      "save_note",
      {
        title: "Save a note",
        description:
          "Save a new note to the user's notebook. Write the body as markdown: what was learned, with the code or commands that matter. Name an existing subject to file it there; with no subject, or one that doesn't exist, it goes to the Inbox. The user sees it marked as recorded by you until they witness it.",
        inputSchema: z.object({
          title: z.string().trim().min(1).max(200).describe("A short title that says what the note is about"),
          body: z.string().max(100_000).describe("The note, in markdown"),
          subject: z.string().trim().max(200).optional().describe("An existing subject's name or id, e.g. \"Rust\""),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ title, body, subject }, ctx) => {
        const { userId, source, origin } = caller(ctx.http?.authInfo);
        const place = await placeNote(userId, subject);
        const note = await insertNote(userId, place.subjectId, { title, notes: body, source });
        indexAfterReply(userId, note.id);
        const where = place.isInbox
          ? place.requested
            ? `the Inbox (there's no subject called "${place.requested}"; call list_subjects to see them)`
            : "the Inbox"
          : place.subjectTitle;
        const url = noteUrl(origin, place.subjectId, place.isInbox, note.id);
        return text(
          `Saved "${note.title}" to ${where}, on page ${note.page}. Note id ${note.id}.\nIt shows as recorded by ${sourceLabel(source)} and waits for the user to witness it.${url ? `\n${url}` : ""}`,
        );
      },
    );

    server.registerTool(
      "append_to_note",
      {
        title: "Add to a note",
        description:
          "Add text to the end of an existing note, under a line saying it came from you and today's date. Never replaces what's there.",
        inputSchema: z.object({
          id: z.string().min(1).describe("The note's id"),
          text: z.string().trim().min(1).max(100_000).describe("What to add, in markdown"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ id, text: addition }, ctx) => {
        const { userId, source, origin } = caller(ctx.http?.authInfo);
        const note = await appendToNote(userId, id, addition, `From ${sourceLabel(source)}`);
        if (!note) return { ...text(`No note with id ${id} in this notebook.`), isError: true };
        indexAfterReply(userId, note.id);
        const url = noteUrl(origin, note.subject.id, note.subject.isInbox, note.id);
        return text(`Added to "${note.title}" in ${note.subject.isInbox ? "the Inbox" : note.subject.title}.${url ? `\n${url}` : ""}`);
      },
    );
  },
  {
    serverInfo: { name: BRAND.name, version: "1.0.0" },
    instructions: `${BRAND.name} is the user's notebook, organised by subject. Search it before answering questions the user may have notes on. Save what's worth keeping (decisions, fixes, explanations) as a note under the right subject; the user reviews and witnesses what you save.`,
  },
);

// The token check made for the rate limit, reused by mcp-handler's own auth
// step so a request is only counted once.
const checked = new WeakMap<Request, TokenAuth | null>();

const authed = withMcpAuth(
  handler,
  async (req, bearer): Promise<AuthInfo | undefined> => {
    const auth = checked.has(req) ? checked.get(req)! : await authenticateToken(bearer);
    if (!auth) return undefined;
    return {
      token: bearer!,
      clientId: auth.tokenId,
      scopes: [],
      // The public origin, for links back into the app (forwarded headers win
      // behind a proxy, which mcp-handler resolves).
      extra: { userId: auth.userId, source: auth.source, origin: getPublicOrigin(req) },
    };
  },
  { required: true },
);

/**
 * Turns away a token that's over its limit before the MCP machinery runs, with
 * 429 and how long to wait. Unknown tokens go through to mcp-handler, which
 * answers 401 with the headers MCP clients expect.
 */
async function rateLimited(req: Request): Promise<Response> {
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const auth = await authenticateToken(bearer);
  checked.set(req, auth);
  if (auth?.limited) {
    return Response.json(
      { error: `Too many requests: ${MCP_REQUESTS_PER_MINUTE} a minute per token. Try again in ${auth.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(auth.retryAfter) } },
    );
  }
  return authed(req);
}

export { rateLimited as GET, rateLimited as POST, rateLimited as DELETE };
