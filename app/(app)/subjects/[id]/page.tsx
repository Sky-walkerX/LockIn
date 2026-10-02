"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSubject, type SubjectDetail } from "@/hooks/useSubjects";
import { useReorderTasks } from "@/hooks/useTasks";
import { SubjectHeader, SubjectProgress } from "@/app/components/subject/subject-header";
import { MilestoneSection } from "@/app/components/subject/milestone-section";
import { ResourceSection } from "@/app/components/subject/resource-section";
import { TaskRow } from "@/app/components/subject/task-row";
import { AddTask } from "@/app/components/subject/add-task";
import { SortableList } from "@/app/components/subject/sortable-list";
import { RevealProvider } from "@/app/components/subject/reveal";
import { NoteList } from "@/app/components/note/note-list";
import { NoteView } from "@/app/components/note/note-view";
import { Skeleton } from "@/app/components/ui/skeleton";
import { parseOpen, revealPath, type RevealTarget } from "@/lib/search/path";
import { ResourceReader } from "@/app/components/reader/resource-reader";

const FALLBACK = "#8b8f9e";
type Tab = "notes" | "resources" | "plan";

// The URL carries everything a link might want to land on:
//   ?note=<id>            a note on the Notes tab (the default tab)
//   ?tab=resources|plan   the other tabs
//   ?read=<id>[&q=…]      the resource reader, over any tab
//   ?open=<kind>:<id>     a search result: a note opens on Notes, a task or
//                         subtask opens Plan and is revealed in the tree
export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession({ required: true });
  const { data: subject, isLoading, isError } = useSubject(id);

  const tab: Tab = (["resources", "plan"] as const).find((t) => t === searchParams.get("tab")) ?? "notes";
  const noteParam = searchParams.get("note");
  const readId = searchParams.get("read");
  const passage = searchParams.get("q");

  const href = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v) next.set(k, v);
      const qs = next.toString();
      return `/subjects/${id}${qs ? `?${qs}` : ""}`;
    },
    [id],
  );
  const here = useMemo(
    () => ({ tab: tab === "notes" ? null : tab, note: tab === "notes" ? noteParam : null }),
    [tab, noteParam],
  );

  // A search result's ?open= becomes a selected note or a Plan reveal. The
  // reveal request moves into state because rows deeper in the tree mount only
  // once their parent has opened, a few renders later, and opening the same
  // result again must count as a new request.
  const openParam = searchParams.get("open");
  const [request, setRequest] = useState<{ target: RevealTarget; nonce: number } | null>(null);
  // Taken up while rendering, once per appearance of the param: the URL drops
  // it straight after, so the same result opened again arrives as a new value.
  const [seenOpen, setSeenOpen] = useState<string | null>(null);
  if (openParam !== seenOpen) {
    setSeenOpen(openParam);
    const target = parseOpen(openParam);
    if (target && target.kind !== "milestone") setRequest((r) => ({ target, nonce: (r?.nonce ?? 0) + 1 }));
  }
  // Then the param leaves the URL: a note opens on Notes, a task on Plan.
  useEffect(() => {
    const target = parseOpen(openParam);
    if (!target) return;
    router.replace(target.kind === "milestone" ? href({ note: target.id }) : href({ tab: "plan" }), { scroll: false });
  }, [openParam, href, router]);

  const pathKey = subject && request ? (revealPath(subject, request.target) ?? []).join(",") : "";
  const nonce = request?.nonce ?? 0;
  const done = useCallback(() => setRequest(null), []);
  const reveal = useMemo(() => {
    const path = pathKey ? pathKey.split(",") : [];
    return { path, target: path[path.length - 1] ?? null, nonce, done };
  }, [pathKey, nonce, done]);

  // A freshly created note opens in the editor.
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const closeReader = useCallback(() => router.replace(href(here), { scroll: false }), [router, href, here]);

  // The Inbox is a subject underneath, but it has its own page.
  const isInbox = subject?.isInbox;
  useEffect(() => {
    if (isInbox) router.replace(`/inbox${searchParams.size ? `?${searchParams}` : ""}`);
  }, [isInbox, router, searchParams]);

  if (status === "loading" || isLoading) {
    return (
      <main className="lk-page">
        <Skeleton className="h-[58px] w-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </main>
    );
  }

  if (isError || !subject) {
    return (
      <main className="lk-page">
        <h1 className="lk-page-title">Section not found</h1>
        <p className="lk-page-sub">It may have been deleted, or the link is from another account.</p>
        <Link href="/" className="lk-btn w-fit px-3 py-2 text-2xs">
          Back to contents
        </Link>
      </main>
    );
  }

  const notes = subject.milestones;
  const selected = notes.find((n) => n.id === noteParam) ?? null;
  // Wide screens always show a page: the requested note, else the most recently
  // written one. Phones show the list until a note is picked.
  const shown =
    selected ??
    (notes.length > 0
      ? [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null);
  const allTasks = [...notes.flatMap((m) => m.tasks), ...subject.tasks];
  const tasksDone = allTasks.filter((t) => t.isCompleted).length;

  const tabs: { key: Tab; label: string; count: string }[] = [
    { key: "notes", label: "Notes", count: String(notes.length) },
    { key: "resources", label: "Resources", count: String(subject.resources.length) },
    { key: "plan", label: "Plan", count: allTasks.length > 0 ? `${tasksDone}/${allTasks.length}` : "" },
  ];

  return (
    <main className="lk-page lk-subject" style={{ "--c": subject.color ?? FALLBACK } as React.CSSProperties}>
      <SubjectHeader subject={subject} />

      <nav className="lk-tabs" aria-label="Section views">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={href({ tab: t.key === "notes" ? null : t.key })}
            scroll={false}
            aria-current={tab === t.key ? "page" : undefined}
            className="lk-tab"
          >
            {t.label}
            {t.count && <span className="lk-tab-count">{t.count}</span>}
          </Link>
        ))}
      </nav>

      {tab === "notes" && (
        <div className="lk-notes-pane" data-has-note={selected ? "" : undefined}>
          <NoteList
            subjectId={subject.id}
            notes={notes}
            selectedId={shown?.id ?? null}
            hrefFor={(noteId) => href({ note: noteId })}
            onCreated={(noteId) => {
              setJustCreated(noteId);
              router.replace(href({ note: noteId }), { scroll: false });
            }}
          />
          {shown ? (
            <NoteView
              key={shown.id}
              note={shown}
              sectionTitle={subject.title}
              planHref={href({ tab: "plan" })}
              backHref={href({})}
              startEditing={justCreated === shown.id}
              onDeleted={() => router.replace(href({}), { scroll: false })}
              onMoved={() => router.replace(href({}), { scroll: false })}
            />
          ) : (
            <div className="lk-note-page lk-note-empty">
              <p>This section has no notes yet.</p>
            </div>
          )}
        </div>
      )}

      {tab === "resources" && <ResourceSection subjectId={subject.id} resources={subject.resources} />}

      {tab === "plan" && (
        <RevealProvider value={reveal}>
          <PlanTab subject={subject} />
        </RevealProvider>
      )}

      {readId && <ResourceReader resourceId={readId} subject={subject} passage={passage} onClose={closeReader} />}
    </main>
  );
}

function PlanTab({ subject }: { subject: SubjectDetail }) {
  const reorderTasks = useReorderTasks();
  const looseDone = subject.tasks.filter((t) => t.isCompleted).length;
  return (
    <div className="grid gap-7">
      <SubjectProgress subject={subject} />
      <MilestoneSection subjectId={subject.id} color={subject.color} milestones={subject.milestones} />
      <section>
        <div className="lk-sec mb-3">
          tasks · not tied to a note{subject.tasks.length > 0 ? ` · ${looseDone}/${subject.tasks.length}` : ""}
        </div>
        <div className="lk-card lk-tree flex flex-col p-2">
          <SortableList ids={subject.tasks.map((t) => t.id)} onReorder={(ids) => reorderTasks.mutate({ ids })}>
            {subject.tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </SortableList>
          <div data-depth="1" className="lk-tsub">
            <AddTask subjectId={subject.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
