// A subject as one Markdown file: readable on its own, and a faithful enough
// copy of the plan to take elsewhere. Pure and structurally typed so it runs
// the same on the server and in tests.

type DateLike = Date | string;

interface ExportSubtask {
  title: string;
  notes: string;
  isCompleted: boolean;
}

interface ExportTask {
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: DateLike | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedTime: number | null; // minutes
  timeSpent: number | null; // minutes
  subtasks: (ExportSubtask & { children: ExportSubtask[] })[];
}

export interface ExportSubject {
  title: string;
  description: string | null;
  targetDate: DateLike | null;
  milestones: {
    title: string;
    notes: string;
    isCompleted: boolean;
    confidence: "WEAK" | "OK" | "STRONG" | null;
    reviewDueAt: DateLike | null;
    weight: number;
    tasks: ExportTask[];
  }[];
  tasks: ExportTask[]; // loose tasks, no milestone
  resources: { title: string; url: string; type: "LINK" | "AI_CHAT" | "PDF" | "BOOK"; note: string | null }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RESOURCE_LABEL = { LINK: "link", AI_CHAT: "AI chat", PDF: "PDF", BOOK: "book" } as const;

// "2 Oct 2026" in the reader's zone. Built from parts rather than a locale
// format, whose month abbreviations vary between ICU versions ("Sep"/"Sept").
function fmtDate(d: DateLike, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(
    new Date(d),
  );
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return `${get("day")} ${MONTHS[get("month") - 1]} ${get("year")}`;
}

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const pad = (depth: number) => "  ".repeat(depth);
const indent = (text: string, depth: number) =>
  text
    .trim()
    .split("\n")
    .map((line) => (line ? pad(depth) + line : line))
    .join("\n");
const box = (done: boolean) => (done ? "[x]" : "[ ]");

// Shift a note's headings so its top level sits under its milestone's `##`,
// keeping their relative depth. Fenced code is skipped: `# ` there is a comment.
function nestHeadings(notes: string): string {
  const lines = notes.split("\n");
  let fenced = false;
  const isHeading: boolean[] = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    return !fenced && /^#{1,6}\s/.test(line);
  });
  const levels = lines.filter((_, i) => isHeading[i]).map((l) => l.match(/^#+/)![0].length);
  if (levels.length === 0) return notes;
  const shift = Math.max(0, 3 - Math.min(...levels));
  return lines
    .map((line, i) => {
      if (!isHeading[i]) return line;
      const level = line.match(/^#+/)![0].length;
      return "#".repeat(Math.min(6, level + shift)) + line.slice(level);
    })
    .join("\n");
}

function subtaskLines(s: ExportSubtask, depth: number): string[] {
  const lines = [`${pad(depth)}- ${box(s.isCompleted)} ${s.title}`];
  if (s.notes.trim()) lines.push(indent(s.notes, depth + 1));
  return lines;
}

function taskLines(t: ExportTask, timeZone: string): string[] {
  const meta = [
    t.dueDate && `due ${fmtDate(t.dueDate, timeZone)}`,
    t.priority !== "MEDIUM" && `${t.priority.toLowerCase()} priority`,
    t.estimatedTime && `est ${fmtMinutes(t.estimatedTime)}`,
    t.timeSpent && `${fmtMinutes(t.timeSpent)} logged`,
  ].filter(Boolean);
  const lines = [`- ${box(t.isCompleted)} ${t.title}${meta.length ? ` — ${meta.join(" · ")}` : ""}`];
  if (t.description?.trim()) lines.push(indent(t.description, 1));
  for (const s of t.subtasks) {
    lines.push(...subtaskLines(s, 1));
    for (const c of s.children) lines.push(...subtaskLines(c, 2));
  }
  return lines;
}

export function subjectToMarkdown(
  subject: ExportSubject,
  { timeZone = "UTC", exportedAt = new Date() }: { timeZone?: string; exportedAt?: Date } = {},
): string {
  const blocks: string[] = [`# ${subject.title}`];
  if (subject.description?.trim()) blocks.push(subject.description.trim());
  blocks.push(
    [subject.targetDate && `- Target: ${fmtDate(subject.targetDate, timeZone)}`, `- Exported: ${fmtDate(exportedAt, timeZone)}`]
      .filter(Boolean)
      .join("\n"),
  );

  for (const m of subject.milestones) {
    blocks.push(`## ${m.isCompleted ? "✓ " : ""}${m.title}`);
    const meta = [
      m.confidence && `Confidence: ${m.confidence.toLowerCase()}`,
      m.isCompleted && m.reviewDueAt && `next review ${fmtDate(m.reviewDueAt, timeZone)}`,
      m.weight !== 1 && `weight ${m.weight}`,
    ].filter(Boolean);
    if (meta.length) blocks.push(`*${meta.join(" · ")}*`);
    if (m.notes.trim()) blocks.push(nestHeadings(m.notes.trim()));
    if (m.tasks.length) blocks.push(m.tasks.flatMap((t) => taskLines(t, timeZone)).join("\n"));
  }

  if (subject.tasks.length) {
    blocks.push(subject.milestones.length ? "## Other tasks" : "## Tasks");
    blocks.push(subject.tasks.flatMap((t) => taskLines(t, timeZone)).join("\n"));
  }

  if (subject.resources.length) {
    blocks.push("## Resources");
    blocks.push(
      subject.resources
        .map((r) => `- [${r.title}](${r.url}) — ${[RESOURCE_LABEL[r.type], r.note?.trim()].filter(Boolean).join(" · ")}`)
        .join("\n"),
    );
  }

  return blocks.join("\n\n") + "\n";
}
