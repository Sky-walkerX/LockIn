"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { addDays, format } from "date-fns";
import { Check, Repeat, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useSubjects, useSubject } from "@/hooks/useSubjects";
import { useCreateTask } from "@/hooks/useTasks";
import { useCreateResource } from "@/hooks/useResources";
import type { Priority, Recurrence, ResourceType } from "@/app/generated/prisma";

const HIDE_ON = ["/login", "/signup", "/forgot-password"];

// ── Context ────────────────────────────────────────────────────────────────
const QuickAddContext = createContext<{ open: () => void }>({ open: () => {} });
export const useQuickAdd = () => useContext(QuickAddContext);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = HIDE_ON.some((p) => pathname?.startsWith(p));
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (!hidden) setIsOpen(true);
  }, [hidden]);

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!hidden) setIsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden]);

  return (
    <QuickAddContext.Provider value={{ open }}>
      {children}
      {isOpen && !hidden && <QuickAddPanel onClose={() => setIsOpen(false)} />}
    </QuickAddContext.Provider>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────
type Mode = "task" | "resource";

function QuickAddPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { data: subjects } = useSubjects();
  const activeSubjects = useMemo(() => (subjects ?? []).filter((s) => !s.isArchived), [subjects]);

  // Default subject: the one we're currently looking at, else the first active one.
  const routeSubjectId = pathname?.match(/^\/subjects\/([^/?#]+)/)?.[1];
  const [subjectId, setSubjectId] = useState("");
  useEffect(() => {
    if (subjectId) return;
    const fallback = routeSubjectId ?? activeSubjects[0]?.id ?? "";
    if (fallback) setSubjectId(fallback);
  }, [subjectId, routeSubjectId, activeSubjects]);

  const [mode, setMode] = useState<Mode>("task");
  const [added, setAdded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Task fields
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [due, setDue] = useState(""); // yyyy-MM-dd
  const [milestoneId, setMilestoneId] = useState("NONE");
  const [recurrence, setRecurrence] = useState<"NONE" | Recurrence>("NONE");

  // Resource fields
  const [type, setType] = useState<ResourceType>("LINK");
  const [url, setUrl] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [note, setNote] = useState("");

  const { data: subjectDetail } = useSubject(subjectId || undefined);
  const milestones = subjectDetail?.milestones ?? [];

  const createTask = useCreateTask();
  const createResource = useCreateResource();
  const pending = createTask.isPending || createResource.isPending;

  // Esc closes; focus the first field on open and after each add.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);
  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  const flashAdded = () => {
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1600);
    inputRef.current?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    if (mode === "task") {
      if (!title.trim()) return;
      createTask.mutate(
        {
          subjectId,
          title: title.trim(),
          milestoneId: milestoneId === "NONE" ? null : milestoneId,
          priority,
          dueDate: due ? new Date(`${due}T00:00:00`).toISOString() : null,
          recurrence: recurrence === "NONE" ? null : recurrence,
        },
        { onSuccess: () => { setTitle(""); flashAdded(); } },
      );
    } else {
      if (!url.trim() || !resTitle.trim()) return;
      createResource.mutate(
        { subjectId, type, url: url.trim(), title: resTitle.trim(), note: note.trim() || undefined },
        { onSuccess: () => { setUrl(""); setResTitle(""); setNote(""); flashAdded(); } },
      );
    }
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`lk-mono rounded-md px-3 py-1 text-[11px] uppercase tracking-wide transition-colors ${
        mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="lk-card mt-[12vh] w-full max-w-lg overflow-hidden p-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header: mode toggle + close */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            {tab("task", "Task")}
            {tab("resource", "Resource")}
          </div>
          <div className="flex items-center gap-2">
            <span className="lk-mono hidden text-[10px] uppercase tracking-wide text-muted-foreground sm:inline">
              ⌘K
            </span>
            <button type="button" onClick={onClose} className="lk-iconbtn" title="Close (Esc)">
              <X size={14} />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3 p-4">
          {activeSubjects.length === 0 ? (
            <p className="lk-mono py-4 text-center text-[12px] text-muted-foreground">
              Create a subject first, then capture into it.
            </p>
          ) : (
            <>
              {/* Subject — shared by both modes */}
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {activeSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {mode === "task" ? (
                <>
                  <Input
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title…"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={recurrence} onValueChange={(v) => setRecurrence(v as "NONE" | Recurrence)}>
                      <SelectTrigger size="sm" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No repeat</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    {milestones.length > 0 && (
                      <Select value={milestoneId} onValueChange={setMilestoneId}>
                        <SelectTrigger size="sm" className="min-w-32 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">No milestone</SelectItem>
                          {milestones.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {/* Due date: quick chips + custom */}
                  <div className="flex flex-wrap items-center gap-2">
                    {([
                      ["None", ""],
                      ["Today", format(new Date(), "yyyy-MM-dd")],
                      ["Tomorrow", format(addDays(new Date(), 1), "yyyy-MM-dd")],
                    ] as const).map(([label, val]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDue(val)}
                        className={`lk-mono rounded-md border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                          due === val
                            ? "border-foreground text-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <Input
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                      className="h-8 flex-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINK">Link</SelectItem>
                      <SelectItem value="AI_CHAT">AI chat</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="BOOK">Book</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    ref={inputRef}
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                  />
                  <Input
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (optional)"
                    rows={2}
                  />
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="lk-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {added ? (
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Check size={12} /> Added
                    </span>
                  ) : recurrence !== "NONE" && mode === "task" ? (
                    <span className="inline-flex items-center gap-1">
                      <Repeat size={11} /> repeats {recurrence.toLowerCase()}
                    </span>
                  ) : (
                    "enter ↵ to add"
                  )}
                </span>
                <button
                  type="submit"
                  disabled={pending}
                  className="lk-btn px-4 py-2 text-[10.5px] disabled:opacity-50"
                >
                  {pending ? "Adding…" : mode === "task" ? "Add task" : "Add resource"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
