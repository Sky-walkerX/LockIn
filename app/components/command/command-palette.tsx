"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import {
  ArrowRight,
  BookmarkPlus,
  CornerDownLeft,
  MessageSquare,
  Moon,
  Plus,
  Search as SearchIcon,
  Sparkles,
  Square,
  Timer,
  X,
} from "lucide-react";
import { isChromeless } from "@/lib/chrome";
import { useSearch } from "@/hooks/useSearch";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useSubject, useSubjects } from "@/hooks/useSubjects";
import { useCreateTask, useTasks } from "@/hooks/useTasks";
import { parseTerms } from "@/lib/search/query";
import { splitMatches } from "@/lib/search/text";
import { parseQuickAdd, type ParsedTask } from "@/lib/quickadd/parse";
import { useQuickAdd } from "../quick-add";
import { useChatPanel } from "../chat/chat-provider";
import { useFocus } from "../focus/focus-provider";

const FALLBACK = "#8b8f9e";

// ── Context ────────────────────────────────────────────────────────────────
const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });
export const useCommandPalette = () => useContext(PaletteContext);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  // Signed out there is nothing to act on, and on chromeless pages (a shared
  // plan, say) ⌘P should still print.
  const hidden = isChromeless(pathname) || status !== "authenticated";
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (!hidden) setIsOpen(true);
  }, [hidden]);

  // ⌘K is the palette; ⌘P, which used to be search alone, opens the same one.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hidden || !(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key !== "k" && key !== "p") return;
      e.preventDefault();
      setIsOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  return (
    <PaletteContext.Provider value={{ open }}>
      {children}
      {isOpen && !hidden && <CommandPanel onClose={() => setIsOpen(false)} />}
    </PaletteContext.Provider>
  );
}

// ── Rows ───────────────────────────────────────────────────────────────────
// Every row, whatever it does, renders the same way and runs on Enter, so the
// arrow keys walk one list.
type Row = {
  key: string;
  label: string;
  tag: string;
  color?: string | null;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  path?: string[];
  snippet?: string | null;
  chips?: string[];
  muted?: boolean;
  disabled?: boolean;
  highlight?: string[];
  run: () => void;
};

type Group = { title: string | null; rows: Row[] };

const PRIORITY_CHIP = { HIGH: "high", MEDIUM: "medium", LOW: "low" } as const;

function taskChips(
  p: ParsedTask,
  subjectTitle: string | null,
  milestoneTitle: string | null,
  milestonesLoading: boolean,
): string[] {
  return [
    subjectTitle ?? (p.subjectQuery ? `no subject “${p.subjectQuery}”` : "add #subject"),
    milestoneTitle ??
      (p.milestoneQuery && subjectTitle
        ? milestonesLoading
          ? `finding @${p.milestoneQuery}…`
          : `no milestone “${p.milestoneQuery}”`
        : null),
    p.dueDate && `due ${format(p.dueDate, "EEE d MMM")}`,
    p.estimatedTime && `est ${p.estimatedTime >= 60 ? `${+(p.estimatedTime / 60).toFixed(1)}h` : `${p.estimatedTime}m`}`,
    p.priority && p.priority !== "MEDIUM" && PRIORITY_CHIP[p.priority],
    p.recurrence && p.recurrence.toLowerCase(),
  ].filter((c): c is string => !!c);
}

const matchesAll = (label: string, words: string[]) => {
  const l = label.toLowerCase();
  return words.every((w) => l.includes(w));
};

// ── Panel ──────────────────────────────────────────────────────────────────
function CommandPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const quickAdd = useQuickAdd();
  const chat = useChatPanel();
  const focus = useFocus();
  const createTask = useCreateTask();

  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Search after a pause in typing, not on every keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setQ(input), 150);
    return () => window.clearTimeout(t);
  }, [input]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Quick add: parse the input as a task ──
  const { data: subjectList = [] } = useSubjects();
  const routeSubjectId = pathname?.match(/^\/subjects\/([^/?#]+)/)?.[1] ?? null;
  const subjects = useMemo(
    () => subjectList.filter((s) => !s.isArchived).map((s) => ({ id: s.id, title: s.title, milestones: [] })),
    [subjectList],
  );
  // Milestones live on the subject detail, so parse once to find the subject,
  // then again with its milestones for the @ match.
  const firstPass = parseQuickAdd(input, { now: new Date(), subjects, defaultSubjectId: routeSubjectId });
  const { data: subjectDetail, isLoading: milestonesLoading } = useSubject(firstPass.subjectId ?? undefined);
  const parsed = subjectDetail
    ? parseQuickAdd(input, {
        now: new Date(),
        subjects: subjects.map((s) =>
          s.id === subjectDetail.id ? { ...s, milestones: subjectDetail.milestones.map((m) => ({ id: m.id, title: m.title })) } : s,
        ),
        defaultSubjectId: routeSubjectId,
      })
    : firstPass;
  // Markers mean the input is a task being written, so creating it leads;
  // plain words are more likely a search, so it trails the results.
  const structured =
    parsed.subjectQuery !== null ||
    parsed.milestoneId !== null ||
    parsed.priority !== null ||
    parsed.dueDate !== null ||
    parsed.estimatedTime !== null ||
    parsed.recurrence !== null;
  const subjectTitle = subjectList.find((s) => s.id === parsed.subjectId)?.title ?? null;
  const milestoneTitle = subjectDetail?.milestones.find((m) => m.id === parsed.milestoneId)?.title ?? null;
  // An @milestone that isn't resolved yet, or matches nothing, would silently
  // file the task loose: hold creation until it's settled.
  const milestoneUnresolved = parsed.milestoneQuery !== null && parsed.milestoneId === null;

  const createRow: Row | null =
    input.trim() && parsed.title
      ? {
          key: "create",
          label: `Create task “${parsed.title}”`,
          tag: "new task",
          icon: Plus,
          chips: taskChips(parsed, subjectTitle, milestoneTitle, milestonesLoading),
          disabled: !parsed.subjectId || milestoneUnresolved,
          run: () => {
            if (!parsed.subjectId || milestoneUnresolved) return;
            createTask.mutate({
              subjectId: parsed.subjectId,
              title: parsed.title,
              milestoneId: parsed.milestoneId,
              priority: parsed.priority ?? undefined,
              dueDate: parsed.dueDate?.toISOString() ?? null,
              estimatedTime: parsed.estimatedTime ?? undefined,
              recurrence: parsed.recurrence,
            });
            onClose();
          },
        }
      : null;

  // ── Actions ──
  const { data: tasks = [] } = useTasks();
  const words = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const isDark = resolvedTheme === "dark";
  const go = (href: string) => () => {
    onClose();
    router.push(href);
  };

  const actions: Row[] = [
    { key: "new-task", label: "New task (full form)…", tag: "action", icon: Plus, run: () => (onClose(), quickAdd.open("task")) },
    { key: "new-resource", label: "New resource…", tag: "action", icon: BookmarkPlus, run: () => (onClose(), quickAdd.open("resource")) },
    input.trim()
      ? { key: "ask", label: `Ask “${input.trim()}”`, tag: "ask ⌘J", icon: MessageSquare, run: () => (onClose(), chat.open({ prompt: input.trim() })) }
      : { key: "ask", label: "Open Ask", tag: "⌘J", icon: MessageSquare, run: () => (onClose(), chat.open()) },
    ...(focus.running
      ? [{ key: "stop-focus", label: "Stop the focus timer", tag: "focus", icon: Square, run: () => (focus.stop(), onClose()) }]
      : []),
    { key: "go-home", label: "Go to Subjects", tag: "go", icon: ArrowRight, run: go("/") },
    { key: "go-focus", label: "Go to Focus", tag: "go", icon: Timer, run: go("/focus") },
    { key: "go-analytics", label: "Go to Analytics", tag: "go", icon: ArrowRight, run: go("/analytics") },
    { key: "go-settings", label: "Go to Settings", tag: "go", icon: ArrowRight, run: go("/settings") },
    {
      key: "theme",
      label: isDark ? "Switch to Creative (light)" : "Switch to Focus (dark)",
      tag: "theme",
      icon: isDark ? Sparkles : Moon,
      run: () => (setTheme(isDark ? "light" : "dark"), onClose()),
    },
  ];
  // Typed words filter actions by label. "Ask …" always matches what was
  // typed, so it goes after the actions that matched on their own.
  const shownActions = words.length
    ? [...actions.filter((a) => a.key !== "ask" && matchesAll(a.label, words)), ...actions.filter((a) => a.key === "ask")]
    : actions;

  // Start a focus session straight on a matching open task.
  const focusRows: Row[] =
    words.length && !focus.running && input.trim().length >= 2
      ? tasks
          .filter((t) => !t.isCompleted && matchesAll(t.title, words))
          .slice(0, 3)
          .map((t) => ({
            key: `focus-${t.id}`,
            label: `Start focus: ${t.title}`,
            tag: "focus",
            icon: Timer,
            color: subjectList.find((s) => s.id === t.subjectId)?.color,
            run: () => {
              focus.startOn(t.id);
              onClose();
              router.push("/focus");
            },
          }))
      : [];

  // ── Search ──
  const { data: hitsData, isFetching, isError } = useSearch(q);
  const semantic = useSemanticSearch(input);
  const tooShort = q.trim().length < 2;
  const hits = tooShort ? [] : (hitsData ?? []);
  const terms = parseTerms(q);
  const resultRows: Row[] = hits.map((h) => ({
    key: `${h.kind}-${h.id}`,
    label: h.title,
    tag: h.kind,
    color: h.color,
    path: h.path,
    snippet: h.snippet,
    muted: h.isCompleted,
    highlight: terms,
    run: go(h.href),
  }));
  const seen = new Set(hits.map((h) => h.id));
  const relatedRows: Row[] =
    semantic.active && semantic.state.status === "ready"
      ? (semantic.results.data ?? [])
          .filter((h) => !seen.has(h.id))
          .map((h) => ({
            key: `sem-${h.kind}-${h.id}`,
            label: h.title,
            tag: h.kind,
            color: h.color,
            path: h.path,
            snippet: h.snippet,
            run: go(h.href),
          }))
      : [];

  const groups: Group[] = [
    ...(createRow && structured ? [{ title: null, rows: [createRow] }] : []),
    { title: words.length ? "actions" : null, rows: [...focusRows, ...shownActions.slice(0, words.length ? 4 : actions.length)] },
    { title: "results", rows: resultRows },
    { title: "related by meaning", rows: relatedRows },
    ...(createRow && !structured ? [{ title: null, rows: [createRow] }] : []),
  ].filter((g) => g.rows.length > 0);
  const rows = groups.flatMap((g) => g.rows);

  // A new input starts from the top.
  useEffect(() => {
    setActive(0);
  }, [input, hitsData]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const runRow = (row: Row | undefined) => {
    if (row && !row.disabled) row.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Handled here, and stopped: the chat panel and the quick-add form listen
    // for Escape on the window, and one press should close only this.
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runRow(rows[active]);
    }
  };

  const st = semantic.state;
  let index = 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="lk-card mt-[12vh] w-full max-w-xl overflow-hidden p-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <SearchIcon size={14} className="flex-none text-muted-foreground" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search, run a command, or add “revise paging fri 2h #os”"
            role="combobox"
            aria-expanded={rows.length > 0}
            aria-controls="lk-palette-results"
            aria-activedescendant={rows[active] ? `lk-row-${active}` : undefined}
            className="lk-mono min-w-0 flex-1 bg-transparent py-1 text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <span className="lk-mono hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">⌘K</span>
          <button type="button" onClick={onClose} className="lk-iconbtn" title="Close (Esc)">
            <X size={14} />
          </button>
        </div>

        <div ref={listRef} id="lk-palette-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-1.5">
          {groups.map((g) => (
            <div key={g.title ?? g.rows[0].key} role="group" aria-label={g.title ?? undefined}>
              {g.title && <div className="lk-sec mt-1.5 px-2.5 pb-1">{g.title}</div>}
              {g.rows.map((row) => {
                const i = index++;
                return <PaletteRow key={row.key} row={row} index={i} active={i === active} onHover={setActive} onRun={runRow} />;
              })}
            </div>
          ))}

          {!tooShort && isError && <Message text="Search failed. Try again." />}
          {/* A task being written isn't a failed search. */}
          {!tooShort && !isError && !structured && hits.length === 0 && relatedRows.length === 0 && (
            <Message text={isFetching || semantic.results.isFetching ? "Searching…" : `No notes match “${q.trim()}”.`} />
          )}

          {!tooShort && semantic.active && st.status === "needs-load" && (
            <button
              type="button"
              onClick={semantic.load}
              className="lk-mono w-full rounded-md px-2.5 py-2 text-left text-[11.5px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Search by meaning too — loads the embedding model (about 130 MB, once)
            </button>
          )}
          {st.status === "loading" && (
            <p className="lk-mono px-2.5 py-2 text-[11.5px] text-muted-foreground">
              Loading the model… {Math.round(st.progress * 100)}%
            </p>
          )}
          {!tooShort && semantic.active && st.status === "ready" && semantic.unindexed > 0 && (
            <p className="lk-mono px-2.5 py-1.5 text-[10.5px] text-muted-foreground">
              {semantic.unindexed} item{semantic.unindexed === 1 ? " isn't" : "s aren't"} indexed yet — they&apos;re indexed
              while Ask (⌘J) is open.
            </p>
          )}
        </div>

        <div className="lk-mono flex items-center gap-3 border-t border-border px-4 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="flex items-center gap-1">
            <CornerDownLeft size={11} /> run
          </span>
          <span>↑↓ move</span>
          <span className="hidden sm:inline"># subject · @ milestone · !h · fri · 2h · daily</span>
        </div>
      </div>
    </div>
  );
}

function Message({ text }: { text: string }) {
  return <p className="lk-mono px-3 py-4 text-center text-[12px] text-muted-foreground">{text}</p>;
}

function PaletteRow({
  row,
  index,
  active,
  onHover,
  onRun,
}: {
  row: Row;
  index: number;
  active: boolean;
  onHover: (i: number) => void;
  onRun: (row: Row) => void;
}) {
  const Icon = row.icon;
  return (
    <button
      id={`lk-row-${index}`}
      data-index={index}
      type="button"
      role="option"
      aria-selected={active}
      aria-disabled={row.disabled || undefined}
      onMouseMove={() => onHover(index)}
      onClick={() => onRun(row)}
      className={`lk-subject flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left ${active ? "bg-muted" : ""} ${
        row.disabled ? "opacity-60" : ""
      }`}
      style={{ "--c": row.color ?? FALLBACK } as React.CSSProperties}
    >
      {Icon ? (
        <Icon size={14} className="mt-0.5 flex-none text-muted-foreground" />
      ) : (
        <span className="lk-swatch mt-1.5 flex-none" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`truncate text-sm ${row.muted ? "text-muted-foreground" : ""}`}>
            <Highlight text={row.label} terms={row.highlight ?? []} />
          </span>
          <span className="lk-tag flex-none">{row.tag}</span>
        </span>
        {row.chips && row.chips.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {row.chips.map((c) => (
              <span key={c} className="lk-mono rounded border border-border px-1.5 py-px text-[10px] text-muted-foreground">
                {c}
              </span>
            ))}
          </span>
        )}
        {row.path && row.path.length > 0 && (
          <span className="lk-mono block truncate text-[10.5px] uppercase tracking-wide text-muted-foreground">
            {row.path.join(" › ")}
          </span>
        )}
        {row.snippet && (
          <span className="lk-mono mt-1 line-clamp-2 block text-[11.5px] text-muted-foreground">
            <Highlight text={row.snippet} terms={row.highlight ?? []} />
          </span>
        )}
      </span>
    </button>
  );
}

// Matched text is underlined in the subject's color rather than painted with
// <mark>'s default yellow, which clashes with both themes.
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  return (
    <>
      {splitMatches(text, terms).map((s, i) =>
        s.match ? (
          <mark key={i} className="bg-transparent font-bold text-foreground underline decoration-(--c) decoration-2 underline-offset-2">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
