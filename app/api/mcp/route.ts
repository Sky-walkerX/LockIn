import { after } from "next/server";
import { createMcpHandler, getPublicOrigin, withMcpAuth } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authenticateToken, MCP_REQUESTS_PER_MINUTE, type TokenAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { appendToNote, editAgentNote, insertNote, matchSubject, moveNote, placeNote } from "@/lib/notes/write";
import { continueNote } from "@/lib/notes/append";
import { createSubtask, createTask } from "@/lib/tasks/create";
import { updateSubtask, updateTask } from "@/lib/tasks/update";
import { pagesOf } from "@/lib/notes/page";
import { sourceLabel } from "@/lib/notes/source";
import { embedOnServer } from "@/lib/rag/ingest";
import { indexNoteOnServer } from "@/lib/rag/index-note";
import { searchKeyword } from "@/lib/search/keyword";
import { searchSemantic } from "@/lib/search/semantic";
import { formatNote, formatPlan, formatPlanItem, formatSearch, formatSubjects, type FoundLine } from "@/lib/mcp/format";
import { readById, readPlan } from "@/lib/mcp/read";

// The notebook's MCP server: agents (Claude Code, Codex, Cursor…) list
// subjects, search, read notes and plans, save and add to notes, edit the
// notes they recorded, file notes, and keep plans up to date. Streamable HTTP
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
const failed = (t: string) => ({ ...text(t), isError: true });
const noSubject = (name: string) => failed(`There's no subject called "${name}". Call list_subjects to see them.`);

/** A subject by name or id, or "Inbox". Archived subjects don't count. */
async function findSubject(userId: string, name: string) {
  const subjects = await prisma.subject.findMany({
    where: { userId, isArchived: false },
    select: { id: true, title: true, isInbox: true },
  });
  return matchSubject(subjects, name) ?? (/^inbox$/i.test(name.trim()) ? subjects.find((s) => s.isInbox) : null) ?? null;
}
const subjectName = (s: { title: string; isInbox: boolean }) => (s.isInbox ? "the Inbox" : s.title);
const noteUrl = (origin: string | null, subjectId: string, isInbox: boolean, noteId: string) =>
  origin ? (isInbox ? `${origin}/inbox?note=${noteId}` : `${origin}/subjects/${subjectId}?note=${noteId}`) : null;
// The subject page opens the Plan tab and expands the rows down to this one.
const planItemUrl = (origin: string | null, subjectId: string, kind: "task" | "subtask", id: string) =>
  origin ? `${origin}/subjects/${subjectId}?open=${kind}:${id}` : null;

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
        title: "Read a note, task or subtask",
        description:
          "Read one item in full by its id. A note comes with its markdown, subject, who wrote it and its plan: each task with its notes and nested subtasks. A task or subtask comes with its notes, where it sits and the subtasks under it.",
        inputSchema: z.object({ id: z.string().min(1).describe("A note, task or subtask id, from search_notes, get_plan or save_note") }),
        annotations: { readOnlyHint: true },
      },
      async ({ id }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        const found = await readById(userId, id);
        if (!found) return { ...text(`No note, task or subtask with id ${id} in this notebook.`), isError: true };
        if (found.kind === "note") {
          const { note } = found;
          return text(formatNote(note, noteUrl(origin, found.subjectId, note.subject.isInbox, note.id)));
        }
        return text(formatPlanItem(found.item, planItemUrl(origin, found.subjectId, found.kind, found.item.id)));
      },
    );

    server.registerTool(
      "get_plan",
      {
        title: "Read a subject's plan",
        description:
          "Read a subject's whole plan: every note's tasks and nested subtasks with what's done, plus tasks not under any note. Long notes on an item are cut short; pass its id to get_note for the rest.",
        inputSchema: z.object({
          subject: z.string().trim().min(1).max(200).describe("A subject's name or id, e.g. \"Rust\", or \"Inbox\""),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ subject }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        const hit = await findSubject(userId, subject);
        const plan = hit ? await readPlan(userId, hit.id) : null;
        if (!hit || !plan) return noSubject(subject);
        const url = origin ? (hit.isInbox ? `${origin}/inbox` : `${origin}/subjects/${hit.id}?tab=plan`) : null;
        return text(formatPlan(plan, url));
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
          body: z.string().max(100_000).describe("The note, in markdown. Maths in LaTeX: $…$ inline, $$…$$ on lines of their own"),
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
          "Add text to the end of an existing note. Never replaces what's there. On a note you recorded it simply continues the note; on anyone else's it goes under a line saying it came from you and today's date.",
        inputSchema: z.object({
          id: z.string().min(1).describe("The note's id"),
          text: z.string().trim().min(1).max(100_000).describe("What to add, in markdown. Maths in LaTeX: $…$ inline, $$…$$ on lines of their own"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ id, text: addition }, ctx) => {
        const { userId, source, origin } = caller(ctx.http?.authInfo);
        const note = await appendToNote(userId, id, addition, source, `From ${sourceLabel(source)}`);
        if (!note) return { ...text(`No note with id ${id} in this notebook.`), isError: true };
        indexAfterReply(userId, note.id);
        const url = noteUrl(origin, note.subject.id, note.subject.isInbox, note.id);
        return text(`Added to "${note.title}" in ${note.subject.isInbox ? "the Inbox" : note.subject.title}.${url ? `\n${url}` : ""}`);
      },
    );

    server.registerTool(
      "edit_note",
      {
        title: "Edit a note you recorded",
        description:
          "Change a note you recorded yourself: give it a new title, or replace one passage with new text (copy old_text exactly from get_note; it must appear once). Notes written by the user or another agent can't be edited, only added to with append_to_note. The user witnesses the note again after an edit.",
        inputSchema: z.object({
          id: z.string().min(1).describe("The note's id"),
          old_text: z.string().min(1).max(100_000).optional().describe("The exact passage to replace, as it is in the note now"),
          new_text: z.string().max(100_000).optional().describe("What replaces it, in markdown. Empty to delete the passage"),
          title: z.string().trim().min(1).max(200).optional().describe("A new title"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false },
      },
      async ({ id, old_text, new_text, title }, ctx) => {
        const { userId, source, origin } = caller(ctx.http?.authInfo);
        if (old_text === undefined && title === undefined) return failed("Nothing to change: give old_text and new_text, a title, or both.");
        if (old_text !== undefined && new_text === undefined) return failed("Give new_text to replace old_text with (empty to delete it).");
        const result = await editAgentNote(userId, id, source, { title, oldText: old_text, newText: new_text });
        switch (result.kind) {
          case "missing":
            return failed(`No note with id ${id} in this notebook.`);
          case "not-yours":
            return failed(`"${result.title}" wasn't recorded by you, so you can't edit it. Use append_to_note to add to it.`);
          case "no-match":
            return failed(
              result.matches === 0
                ? "old_text isn't in the note. Call get_note for its current text and copy the passage exactly."
                : `old_text appears ${result.matches} times in the note. Include more of the text around it so it matches once.`,
            );
        }
        const { note } = result;
        indexAfterReply(userId, note.id);
        const url = noteUrl(origin, note.subject.id, note.subject.isInbox, note.id);
        return text(`Edited "${note.title}" in ${subjectName(note.subject)}. It waits for the user to witness it again.${url ? `\n${url}` : ""}`);
      },
    );

    server.registerTool(
      "move_note",
      {
        title: "Move a note",
        description: "File a note under another subject, e.g. out of the Inbox. Its tasks go with it. The subject must already exist.",
        inputSchema: z.object({
          id: z.string().min(1).describe("The note's id"),
          subject: z.string().trim().min(1).max(200).describe("The subject's name or id, or \"Inbox\""),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ id, subject }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        const target = await findSubject(userId, subject);
        if (!target) return noSubject(subject);
        const moved = await moveNote(userId, id, target.id);
        if (moved === "note-missing") return failed(`No note with id ${id} in this notebook.`);
        if (moved === "subject-missing") return noSubject(subject);
        indexAfterReply(userId, moved.id);
        const url = noteUrl(origin, target.id, target.isInbox, moved.id);
        return text(`"${moved.title}" is now in ${subjectName(target)}, with its tasks.${url ? `\n${url}` : ""}`);
      },
    );

    server.registerTool(
      "add_task",
      {
        title: "Add a task to a plan",
        description:
          "Add a task to the user's plan, at the end of a note's tasks (give note_id) or of a subject's tasks that aren't under any note (give subject).",
        inputSchema: z.object({
          title: z.string().trim().min(1).max(200).describe("What to do, short"),
          notes: z.string().max(100_000).optional().describe("Notes on the task, in markdown"),
          note_id: z.string().min(1).optional().describe("The note to put it under"),
          subject: z.string().trim().min(1).max(200).optional().describe("A subject's name or id, when it isn't under a note"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ title, notes, note_id, subject }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        let place: { subjectId: string; where: string; milestoneId: string | null };
        if (note_id) {
          const note = await prisma.milestone.findFirst({
            where: { id: note_id, subject: { userId } },
            select: { id: true, title: true, subject: { select: { id: true, title: true, isInbox: true } } },
          });
          if (!note) return failed(`No note with id ${note_id} in this notebook.`);
          place = { subjectId: note.subject.id, milestoneId: note.id, where: `under "${note.title}" in ${subjectName(note.subject)}` };
        } else if (subject) {
          const target = await findSubject(userId, subject);
          if (!target) return noSubject(subject);
          place = { subjectId: target.id, milestoneId: null, where: `in ${subjectName(target)}, not under a note` };
        } else {
          return failed("Say where the task goes: note_id, or subject.");
        }
        const task = await createTask(userId, { subjectId: place.subjectId, milestoneId: place.milestoneId, title, description: notes });
        if (typeof task === "string") return failed("That note or subject is gone.");
        const url = planItemUrl(origin, place.subjectId, "task", task.id);
        return text(`Added task "${task.title}" ${place.where}. Task id ${task.id}.${url ? `\n${url}` : ""}`);
      },
    );

    server.registerTool(
      "add_subtask",
      {
        title: "Add a subtask",
        description:
          "Add a subtask to a task, at the end of its list. Give parent_id to put it under another subtask instead; nesting goes one level deep.",
        inputSchema: z.object({
          task_id: z.string().min(1).describe("The task's id"),
          title: z.string().trim().min(1).max(200).describe("What to do, short"),
          notes: z.string().max(100_000).optional().describe("Notes on the subtask, in markdown"),
          parent_id: z.string().min(1).optional().describe("A top-level subtask of the same task to nest it under"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ task_id, title, notes, parent_id }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        const subtask = await createSubtask(userId, { taskId: task_id, parentId: parent_id, title, notes });
        if (subtask === "task-missing") return failed(`No task with id ${task_id} in this notebook.`);
        if (subtask === "parent-missing") return failed(`No subtask with id ${parent_id} under that task.`);
        if (subtask === "too-deep") return failed("That subtask is already nested. Nest under a top-level subtask, or leave parent_id out.");
        const task = await prisma.task.findUnique({ where: { id: task_id }, select: { title: true, subjectId: true } });
        const url = task ? planItemUrl(origin, task.subjectId, "subtask", subtask.id) : null;
        return text(`Added subtask "${subtask.title}" to "${task?.title ?? "the task"}". Subtask id ${subtask.id}.${url ? `\n${url}` : ""}`);
      },
    );

    server.registerTool(
      "update_plan_item",
      {
        title: "Update a task or subtask",
        description:
          "Change a task or subtask: tick it done or not done, rename it, or add to its notes (added at the end; what's there stays). Completing a recurring task schedules its next one.",
        inputSchema: z.object({
          id: z.string().min(1).describe("A task or subtask id, from get_plan, get_note or search_notes"),
          done: z.boolean().optional().describe("true to tick it, false to untick it"),
          title: z.string().trim().min(1).max(200).optional().describe("A new title"),
          add_notes: z.string().trim().min(1).max(100_000).optional().describe("Text to add to the end of its notes, in markdown"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ id, done, title, add_notes }, ctx) => {
        const { userId, origin } = caller(ctx.http?.authInfo);
        if (done === undefined && title === undefined && add_notes === undefined) {
          return failed("Nothing to change: give done, title or add_notes.");
        }
        const [task, subtask] = await Promise.all([
          prisma.task.findFirst({ where: { id, userId }, select: { description: true, subjectId: true } }),
          prisma.subtask.findFirst({ where: { id, task: { userId } }, select: { notes: true, task: { select: { subjectId: true } } } }),
        ]);
        const changes = [
          done === true ? "ticked done" : done === false ? "unticked" : null,
          title !== undefined ? "renamed" : null,
          add_notes !== undefined ? "notes added" : null,
        ].filter(Boolean).join(", ");
        if (task) {
          const updated = await updateTask(userId, id, {
            isCompleted: done,
            title,
            description: add_notes !== undefined ? continueNote(task.description ?? "", add_notes) : undefined,
          });
          if (!updated || updated === "empty") return failed(`No task or subtask with id ${id} in this notebook.`);
          const url = planItemUrl(origin, task.subjectId, "task", id);
          return text(`Task "${updated.title}": ${changes}.${url ? `\n${url}` : ""}`);
        }
        if (subtask) {
          const updated = await updateSubtask(userId, id, {
            isCompleted: done,
            title,
            notes: add_notes !== undefined ? continueNote(subtask.notes, add_notes) : undefined,
          });
          if (!updated || updated === "empty") return failed(`No task or subtask with id ${id} in this notebook.`);
          const url = planItemUrl(origin, subtask.task.subjectId, "subtask", id);
          return text(`Subtask "${updated.title}": ${changes}.${url ? `\n${url}` : ""}`);
        }
        return failed(`No task or subtask with id ${id} in this notebook.`);
      },
    );
  },
  {
    serverInfo: { name: BRAND.name, version: "1.0.0" },
    instructions: `${BRAND.name} is the user's notebook, organised by subject. Search it before answering questions the user may have notes on. Save what's worth keeping (decisions, fixes, explanations) as a note under the right subject; the user reviews and witnesses what you save. You can edit only notes you recorded; anyone else's you can add to with append_to_note. Keep the user's plans current: tick off tasks that are done and add the ones that come up. Notes are GitHub-flavoured markdown that renders LaTeX: write maths as $e_K \\in E$ inline and $$…$$ on lines of their own for display, not as Unicode symbols. To pin something as a numbered figure (code output, a table, a key formula), quote it under a first line of "> [!FIG] caption".`,
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
