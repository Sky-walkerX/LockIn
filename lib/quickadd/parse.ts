// Natural-language quick add: "revise paging fri 2h !h #os @mem" becomes a
// task titled "revise paging", due Friday, estimated 2h, high priority, in
// Operating Systems under its Memory milestone. Pure: `now` and the subjects
// come in, so the grammar is testable.
//
//   #subject    initials, a word prefix, or #"quoted name"
//   @milestone  same matching, inside the chosen subject
//   !h !m !l    priority (also !high, !1 …)
//   today tod tomorrow tmr, mon…sun (next occurrence), next week,
//   in 3d / in 2 weeks, 12 oct / oct 12
//   2h 45m 1h30m 1.5h   estimate
//   daily weekly monthly, every day|week|month
//
// Each kind of marker counts once; a repeat stays in the title as a word.
// Numeric dates like 12/10 are left alone: day-first or month-first is a guess.

export type QuickAddSubject = { id: string; title: string; milestones: { id: string; title: string }[] };

export type ParsedTask = {
  title: string;
  subjectId: string | null;
  /** What followed `#`, matched or not, so the UI can say what it didn't find. */
  subjectQuery: string | null;
  milestoneId: string | null;
  /** What followed `@`, matched or not. */
  milestoneQuery: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | null;
  dueDate: Date | null; // local midnight, like the quick-add form
  estimatedTime: number | null; // minutes
  recurrence: "DAILY" | "WEEKLY" | "MONTHLY" | null;
};

// Maps, not object literals: a user's word is the key, and "constructor" or
// "toString" must not find Object.prototype's members.
const PRIORITY = new Map<string, NonNullable<ParsedTask["priority"]>>([
  ["h", "HIGH"], ["high", "HIGH"], ["1", "HIGH"],
  ["m", "MEDIUM"], ["med", "MEDIUM"], ["medium", "MEDIUM"], ["2", "MEDIUM"],
  ["l", "LOW"], ["low", "LOW"], ["3", "LOW"],
]);

const WEEKDAYS = new Map<string, number>([
  ["sun", 0], ["sunday", 0],
  ["mon", 1], ["monday", 1],
  ["tue", 2], ["tues", 2], ["tuesday", 2],
  ["wed", 3], ["wednesday", 3],
  ["thu", 4], ["thur", 4], ["thurs", 4], ["thursday", 4],
  ["fri", 5], ["friday", 5],
  ["sat", 6], ["saturday", 6],
]);

const MONTHS = new Map<string, number>([
  ...["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].flatMap(
    (name, i): [string, number][] => [[name, i], [name.slice(0, 3), i]],
  ),
  ["sept", 8],
]);

// Single words, and the unit after "every".
const RECURRENCE = new Map<string, NonNullable<ParsedTask["recurrence"]>>([
  ["daily", "DAILY"], ["weekly", "WEEKLY"], ["monthly", "MONTHLY"],
]);
const EVERY = new Map<string, NonNullable<ParsedTask["recurrence"]>>([
  ["day", "DAILY"], ["week", "WEEKLY"], ["month", "MONTHLY"],
]);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const unquote = (s: string) => s.replace(/^"|"$/g, "").trim();

/** Best match for `query` among `items` by title: exact, initials, title prefix, then word prefix. */
function match<T extends { title: string }>(items: T[], query: string): T | null {
  const q = query.toLowerCase();
  if (!q) return null;
  const rules: ((title: string) => boolean)[] = [
    (t) => t === q,
    (t) => t.split(/\s+/).map((w) => w[0]).join("") === q,
    (t) => t.startsWith(q),
    (t) => t.split(/\s+/).some((w) => w.startsWith(q)),
  ];
  for (const rule of rules) {
    const hit = items.find((i) => rule(i.title.toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

function validDate(y: number, m: number, d: number): Date | null {
  const date = new Date(y, m, d);
  return date.getMonth() === m && date.getDate() === d ? date : null;
}

export function parseQuickAdd(
  input: string,
  { now, subjects, defaultSubjectId }: { now: Date; subjects: QuickAddSubject[]; defaultSubjectId: string | null },
): ParsedTask {
  const tokens = input.match(/[#@]"[^"]*"?|\S+/g) ?? [];
  const lower = tokens.map((t) => t.toLowerCase());
  const used = new Set<number>();
  const today = startOfDay(now);

  let subjectQuery: string | null = null;
  let milestoneQuery: string | null = null;
  let priority: ParsedTask["priority"] = null;
  let dueDate: Date | null = null;
  let estimatedTime: number | null = null;
  let recurrence: ParsedTask["recurrence"] = null;

  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue;
    const t = lower[i];
    const next = lower[i + 1];
    const take = (n = 1) => {
      for (let k = 0; k < n; k++) used.add(i + k);
    };

    if (t.startsWith("#") && t.length > 1 && subjectQuery === null) {
      subjectQuery = unquote(tokens[i].slice(1));
      take();
    } else if (t.startsWith("@") && t.length > 1 && milestoneQuery === null) {
      milestoneQuery = unquote(tokens[i].slice(1));
      take();
    } else if (t.startsWith("!") && PRIORITY.has(t.slice(1)) && priority === null) {
      priority = PRIORITY.get(t.slice(1))!;
      take();
    } else if (recurrence === null && RECURRENCE.has(t)) {
      recurrence = RECURRENCE.get(t)!;
      take();
    } else if (recurrence === null && t === "every" && next && EVERY.has(next)) {
      recurrence = EVERY.get(next)!;
      take(2);
    } else if (estimatedTime === null && /^\d+(\.\d+)?h(\d+m)?$|^\d+m$/.test(t)) {
      const h = t.match(/^(\d+(?:\.\d+)?)h/);
      const m = t.match(/(\d+)m$/);
      estimatedTime = Math.round((h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0));
      take();
    } else if (dueDate === null) {
      const d = dateAt(i);
      if (d) {
        dueDate = d.date;
        take(d.tokens);
      }
    }
  }

  function dateAt(i: number): { date: Date; tokens: number } | null {
    const t = lower[i];
    const a = lower[i + 1];
    const b = lower[i + 2];
    if (t === "today" || t === "tod") return { date: today, tokens: 1 };
    if (t === "tomorrow" || t === "tmr" || t === "tmrw") return { date: addDays(today, 1), tokens: 1 };
    if (t === "next" && a === "week") return { date: addDays(today, ((8 - today.getDay()) % 7) || 7), tokens: 2 };
    if (t === "in" && a) {
      const short = a.match(/^(\d+)([dw])$/);
      if (short) return { date: addDays(today, Number(short[1]) * (short[2] === "w" ? 7 : 1)), tokens: 2 };
      if (/^\d+$/.test(a) && b && /^(days?|weeks?)$/.test(b)) {
        return { date: addDays(today, Number(a) * (b.startsWith("w") ? 7 : 1)), tokens: 3 };
      }
    }
    const wd = WEEKDAYS.get(t);
    if (wd !== undefined) return { date: addDays(today, (wd - today.getDay() + 7) % 7 || 7), tokens: 1 };
    // "12 oct" or "oct 12"
    const pair: [number, number] | null =
      /^\d{1,2}$/.test(t) && a && MONTHS.has(a)
        ? [Number(t), MONTHS.get(a)!]
        : MONTHS.has(t) && a && /^\d{1,2}$/.test(a)
          ? [Number(a), MONTHS.get(t)!]
          : null;
    if (pair) {
      const [d, m] = pair;
      let date = validDate(today.getFullYear(), m, d);
      if (date && date < today) date = validDate(today.getFullYear() + 1, m, d);
      if (date) return { date, tokens: 2 };
    }
    return null;
  }

  const subject = subjectQuery !== null ? match(subjects, subjectQuery) : null;
  const subjectId = subject?.id ?? (subjectQuery === null ? defaultSubjectId : null);
  const milestones = subjects.find((s) => s.id === subjectId)?.milestones ?? [];
  const milestone = milestoneQuery !== null ? match(milestones, milestoneQuery) : null;

  return {
    title: tokens.filter((_, i) => !used.has(i)).join(" "),
    subjectId,
    subjectQuery,
    milestoneId: milestone?.id ?? null,
    milestoneQuery,
    priority,
    dueDate,
    estimatedTime,
    recurrence,
  };
}
