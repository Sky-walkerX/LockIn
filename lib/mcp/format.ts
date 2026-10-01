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

export type FoundLine = { kind: string; id: string; title: string; path: string[]; snippet: string | null; href: string };

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
    const parts = [`${i + 1}. ${h.title} (${KIND_WORD[h.kind] ?? h.kind}${where}) id ${h.id}`];
    if (h.snippet) parts.push(`   ${h.snippet.replace(/\s+/g, " ").trim()}`);
    if (origin) parts.push(`   ${origin}${h.href}`);
    return parts.join("\n");
  });
  const how = mode === "meaning" ? "by meaning, then by keyword" : "by keyword";
  return `Matches for "${query}" (${how}):\n${lines.join("\n")}\n\nUse get_note with a note's id to read it in full.`;
}

export type NoteForAgent = {
  id: string;
  title: string;
  notes: string;
  source: string | null;
  witnessedAt: Date | string | null;
  updatedAt: Date | string;
  subject: { title: string; isInbox: boolean };
  tasks: { title: string; isCompleted: boolean }[];
};

export function formatNote(note: NoteForAgent, url: string | null): string {
  const meta = [
    note.subject.isInbox ? "In the Inbox (not filed yet)" : `Subject: ${note.subject.title}`,
    isOwnNote(note.source) ? "Written by the user" : `Recorded by ${sourceLabel(note.source)}`,
    awaitingWitness(note) ? "Not yet witnessed by the user" : null,
    `Updated ${new Date(note.updatedAt).toISOString().slice(0, 10)}`,
  ].filter(Boolean);
  const tasks =
    note.tasks.length > 0
      ? `\n\nTasks:\n${note.tasks.map((t) => `- [${t.isCompleted ? "x" : " "}] ${t.title}`).join("\n")}`
      : "";
  const body = note.notes.trim() || "(This note has no body yet.)";
  return `# ${note.title}\n${meta.join(" · ")}${url ? `\n${url}` : ""}\n\n${body}${tasks}`;
}
