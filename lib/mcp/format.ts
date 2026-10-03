// How the MCP tools answer, as plain text an agent reads well: short lines,
// ids it can pass back, and links the user can open. Pure, so it's tested
// without a server.

import { sourceLabel, awaitingWitness, isOwnNote } from "@/lib/notes/source";

export type SubjectLine = { id: string; title: string; isInbox: boolean; noteCount: number };

export function formatSubjects(subjects: SubjectLine[]): string {
  if (subjects.length === 0) return "The notebook has no subjects yet. save_note without a subject files into the Inbox.";
  const lines = subjects.map((s) =>
    s.isInbox
      ? `- Inbox: ${s.noteCount} unfiled note${s.noteCount === 1 ? "" : "s"} (id ${s.id})`
      : `- ${s.title}: ${s.noteCount} note${s.noteCount === 1 ? "" : "s"} (id ${s.id})`,
  );
  return `Subjects in the user's notebook:\n${lines.join("\n")}`;
}

export type FoundLine = {
  kind: string;
  id: string;
  title: string;
  path: string[];
  snippet: string | null;
  href: string;
  /** The note's or resource's page, so an agent can cite it as the user sees it. */
  page?: number | null;
};

const KIND_WORD: Record<string, string> = {
  milestone: "note",
  subject: "subject",
  task: "task",
  subtask: "subtask",
  resource: "resource",
  document: "document",
};

export function formatSearch(query: string, hits: FoundLine[], origin: string | null, mode: "meaning" | "keyword"): string {
  if (hits.length === 0) return `Nothing in the notebook matches "${query}".`;
  const lines = hits.map((h, i) => {
    const where = h.path.length > 0 ? `, in ${h.path.join(" › ")}` : "";
    const page = h.page != null ? `, p. ${h.page}` : "";
    const parts = [`${i + 1}. ${h.title} (${KIND_WORD[h.kind] ?? h.kind}${page}${where}) id ${h.id}`];
    if (h.snippet) parts.push(`   ${h.snippet.replace(/\s+/g, " ").trim()}`);
    if (origin) parts.push(`   ${origin}${h.href}`);
    return parts.join("\n");
  });
  const how = mode === "meaning" ? "by meaning, then by keyword" : "by keyword";
  return `Matches for "${query}" (${how}):\n${lines.join("\n")}\n\nUse get_note with a note, task or subtask id to read it in full, or get_plan with a subject id for its whole plan.`;
}

// The Plan tab: notes hold tasks, tasks hold subtasks, and a subtask can hold
// subtasks of its own. Each level can carry markdown notes.

export type PlanSubtask = { id: string; title: string; isCompleted: boolean; notes: string; parentId: string | null };
export type PlanTask = {
  id: string;
  title: string;
  isCompleted: boolean;
  description: string | null;
  subtasks: PlanSubtask[];
};

const box = (done: boolean) => `[${done ? "x" : " "}]`;
const doneOf = (items: { isCompleted: boolean }[]) => `${items.filter((i) => i.isCompleted).length} of ${items.length}`;

/** Notes cut to `limit` characters, pointing at get_note for the rest. */
function clip(text: string, id: string, limit?: number): string {
  const t = text.trim();
  if (!limit || t.length <= limit) return t;
  return `${t.slice(0, limit).trimEnd()}… (get_note ${id} for the rest)`;
}

function pushNotes(lines: string[], text: string, id: string, depth: number, limit?: number) {
  const notes = clip(text, id, limit);
  if (!notes) return;
  const pad = "  ".repeat(depth);
  lines.push(notes.split("\n").map((l) => (l ? pad + l : l)).join("\n"));
}

/** The subtasks under `parentId` (null for a task's top level), nested by indent. */
function pushSubtasks(lines: string[], all: PlanSubtask[], parentId: string | null, depth: number, limit?: number) {
  for (const s of all.filter((x) => x.parentId === parentId)) {
    lines.push(`${"  ".repeat(depth)}- ${box(s.isCompleted)} ${s.title} (subtask ${s.id})`);
    pushNotes(lines, s.notes, s.id, depth + 1, limit);
    pushSubtasks(lines, all, s.id, depth + 1, limit);
  }
}

/** Tasks as a markdown checklist, each with its notes and its subtasks indented under it. */
export function formatTasks(tasks: PlanTask[], notesLimit?: number): string {
  const lines: string[] = [];
  for (const t of tasks) {
    const subs = t.subtasks.length > 0 ? `, ${doneOf(t.subtasks)} subtasks done` : "";
    lines.push(`- ${box(t.isCompleted)} ${t.title} (task ${t.id}${subs})`);
    pushNotes(lines, t.description ?? "", t.id, 1, notesLimit);
    pushSubtasks(lines, t.subtasks, null, 1, notesLimit);
  }
  return lines.join("\n");
}

export type NoteForAgent = {
  id: string;
  page: number | null;
  title: string;
  notes: string;
  source: string | null;
  witnessedAt: Date | string | null;
  updatedAt: Date | string;
  subject: { title: string; isInbox: boolean };
  tasks: PlanTask[];
};

export function formatNote(note: NoteForAgent, url: string | null): string {
  const meta = [
    note.page != null ? `Page ${note.page}` : null,
    note.subject.isInbox ? "In the Inbox (not filed yet)" : `Subject: ${note.subject.title}`,
    isOwnNote(note.source) ? "Written by the user" : `Recorded by ${sourceLabel(note.source)}`,
    awaitingWitness(note) ? "Not yet witnessed by the user" : null,
    `Updated ${new Date(note.updatedAt).toISOString().slice(0, 10)}`,
  ].filter(Boolean);
  const plan =
    note.tasks.length > 0 ? `\n\nPlan (${doneOf(note.tasks)} tasks done):\n${formatTasks(note.tasks)}` : "";
  const body = note.notes.trim() || "(This note has no body yet.)";
  return `# ${note.title}\n${meta.join(" · ")}${url ? `\n${url}` : ""}\n\n${body}${plan}`;
}

export type PlanItemForAgent = {
  kind: "task" | "subtask";
  id: string;
  title: string;
  isCompleted: boolean;
  notes: string;
  /** Where it sits, outermost first: subject, note, then task and parent subtask for a subtask. */
  path: string[];
  /** For a task, all its subtasks; for a subtask, its task's, of which those under it are shown. */
  subtasks: PlanSubtask[];
};

export function formatPlanItem(item: PlanItemForAgent, url: string | null): string {
  const meta = [
    item.kind === "task" ? "Task" : "Subtask",
    item.isCompleted ? "Done" : "Not done",
    item.path.length > 0 ? `In ${item.path.join(" › ")}` : null,
  ].filter(Boolean);
  const lines: string[] = [];
  pushSubtasks(lines, item.subtasks, item.kind === "task" ? null : item.id, 0);
  const subtasks = lines.length > 0 ? `\n\nSubtasks:\n${lines.join("\n")}` : "";
  const notes = item.notes.trim() || "(No notes yet.)";
  return `# ${item.title}\n${meta.join(" · ")}${url ? `\n${url}` : ""}\n\n${notes}${subtasks}`;
}

export type PlanForAgent = {
  subject: { title: string; isInbox: boolean };
  notes: { id: string; title: string; page: number | null; tasks: PlanTask[] }[];
  /** Tasks in the subject that aren't under any note. */
  loose: PlanTask[];
};

/** How much of each item's notes get_plan shows; get_note has the rest. */
export const PLAN_NOTES_LIMIT = 500;

export function formatPlan(plan: PlanForAgent, url: string | null): string {
  const name = plan.subject.isInbox ? "the Inbox" : plan.subject.title;
  const planned = plan.notes.filter((n) => n.tasks.length > 0);
  const tasks = [...planned.flatMap((n) => n.tasks), ...plan.loose];
  if (tasks.length === 0) return `Nothing is planned in ${name} yet.${url ? `\n${url}` : ""}`;

  const subtasks = tasks.flatMap((t) => t.subtasks);
  const totals = [`${doneOf(tasks)} tasks done`, subtasks.length > 0 ? `${doneOf(subtasks)} subtasks done` : null];
  const sections = planned.map((n) => {
    const page = n.page != null ? `, p. ${n.page}` : "";
    return `## ${n.title} (note ${n.id}${page})\n${formatTasks(n.tasks, PLAN_NOTES_LIMIT)}`;
  });
  if (plan.loose.length > 0) sections.push(`## Not under a note\n${formatTasks(plan.loose, PLAN_NOTES_LIMIT)}`);
  const unplanned = plan.notes.filter((n) => n.tasks.length === 0);
  const rest =
    unplanned.length > 0 ? `\n\nNotes with nothing planned: ${unplanned.map((n) => `${n.title} (${n.id})`).join(", ")}` : "";
  return `# Plan for ${name}\n${totals.filter(Boolean).join(", ")}${url ? `\n${url}` : ""}\n\n${sections.join("\n\n")}${rest}`;
}
