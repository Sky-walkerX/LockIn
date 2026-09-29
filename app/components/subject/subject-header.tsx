"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useUpdateSubject, useDeleteSubject } from "@/hooks/useSubjects";
import type { SubjectDetail } from "@/hooks/useSubjects";
import { SUBJECT_PALETTE } from "@/app/components/home/new-subject";
import { ShareButton } from "@/app/components/share/share-button";
import { isReviewDue } from "@/app/components/review/revision";
import { PACE_META, PaceBar, countdown } from "@/app/components/pace/pace";
import { computeCoverage, subjectPace } from "@/lib/pace/pace";
import { endOfDay, format, startOfDay } from "date-fns";
import { RuledBoxes } from "@/app/components/notebook/ruled-boxes";

// <input type="date"> speaks yyyy-MM-dd in local time. A target counts through
// the end of its day; a start counts from its beginning.
const toInput = (d: Date | string | null) => (d ? format(new Date(d), "yyyy-MM-dd") : "");
const fromInput = (v: string, edge: "start" | "end") =>
  v ? (edge === "end" ? endOfDay(new Date(`${v}T00:00`)) : startOfDay(new Date(`${v}T00:00`))).toISOString() : null;

const FALLBACK = "#8b8f9e";

export function SubjectHeader({ subject }: { subject: SubjectDetail }) {
  const router = useRouter();
  const update = useUpdateSubject();
  const del = useDeleteSubject();

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(subject.title);
  const [description, setDescription] = useState(subject.description ?? "");
  const [color, setColor] = useState(subject.color ?? SUBJECT_PALETTE[0]);
  const [targetDate, setTargetDate] = useState(toInput(subject.targetDate));
  const [startDate, setStartDate] = useState(toInput(subject.startDate));
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Re-seed the draft fields every time the popover opens so an edit started
  // after a background refetch shows current values, not mount-time ones.
  const openEdit = (o: boolean) => {
    if (o) {
      setTitle(subject.title);
      setDescription(subject.description ?? "");
      setColor(subject.color ?? SUBJECT_PALETTE[0]);
      setTargetDate(toInput(subject.targetDate));
      setStartDate(toInput(subject.startDate));
    }
    setEditOpen(o);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update.mutate(
      {
        id: subject.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          color,
          targetDate: fromInput(targetDate, "end"),
          startDate: fromInput(startDate, "start"),
        },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const toggleArchive = () =>
    update.mutate({ id: subject.id, data: { isArchived: !subject.isArchived } });

  const remove = () =>
    del.mutate(subject.id, { onSuccess: () => router.push("/") });

  return (
    <header className="lk-subject grid gap-5" style={{ "--c": subject.color ?? FALLBACK } as React.CSSProperties}>
      <RuledBoxes
        items={[
          {
            label: "Section",
            value: (
              <span className="flex items-center gap-2">
                <i className="lk-tab-chip" style={{ background: "var(--c-eff)" }} aria-hidden />
                <span className="truncate">{subject.title}</span>
              </span>
            ),
            grow: 2,
          },
          { label: "Notes", value: subject.milestones.length },
          { label: "Resources", value: subject.resources.length },
          { label: "Updated", value: format(new Date(subject.updatedAt), "d MMM yyyy"), grow: 1.3 },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="lk-page-title flex items-center gap-3">
            {subject.title}
            {subject.isArchived && <span className="lk-tag">archived</span>}
          </h1>
          {subject.description && <p className="lk-page-sub max-w-2xl">{subject.description}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Popover open={editOpen} onOpenChange={openEdit}>
            <PopoverTrigger asChild>
              <button type="button" className="lk-iconbtn" title="Edit subject">
                <Pencil size={15} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <form onSubmit={saveEdit} className="flex flex-col gap-3">
                <div className="lk-sec">Edit subject</div>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                />
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Pick ${c}`}
                      className={`h-6 w-6 rounded-md border-2 transition-transform ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="lk-print flex flex-col gap-1 text-2xs uppercase tracking-wide text-muted-foreground">
                    Exam / target
                    <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                  </label>
                  <label className="lk-print flex flex-col gap-1 text-2xs uppercase tracking-wide text-muted-foreground">
                    Started
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      title="Defaults to when you created the subject"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={update.isPending || !title.trim()}
                  className="lk-btn px-3 py-2 text-2xs disabled:opacity-50"
                >
                  {update.isPending ? "Saving…" : "Save"}
                </button>
              </form>
            </PopoverContent>
          </Popover>

          <ShareButton target={{ type: "SUBJECT", entityId: subject.id }} size={15} />

          <button
            type="button"
            onClick={toggleArchive}
            className="lk-iconbtn"
            title={subject.isArchived ? "Unarchive" : "Archive"}
          >
            {subject.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </button>

          <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="lk-iconbtn hover:text-destructive" title="Delete subject">
                <Trash2 size={15} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="flex flex-col gap-3">
                <div className="lk-sec">Delete subject?</div>
                <p className="text-xs text-muted-foreground">
                  This permanently removes its notes, tasks &amp; resources.
                </p>
                <button
                  type="button"
                  onClick={remove}
                  disabled={del.isPending}
                  className="lk-btn px-3 py-2 text-2xs disabled:opacity-50"
                  style={{ background: "var(--destructive)", color: "#fff" }}
                >
                  {del.isPending ? "Deleting…" : "Delete forever"}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

    </header>
  );
}

// Task progress, or weighted syllabus coverage against the exam date when the
// subject has one. Part of the Plan layer, so it lives on the Plan tab.
export function SubjectProgress({ subject }: { subject: SubjectDetail }) {
  const milestoneTasks = subject.milestones.flatMap((m) => m.tasks);
  const allTasks = [...milestoneTasks, ...subject.tasks];
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.isCompleted).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;
  const weak = subject.milestones.filter((m) => m.confidence === "WEAK").length;
  const toRevise = subject.milestones.filter((m) => m.isCompleted && isReviewDue(m.reviewDueAt)).length;

  const coverage = computeCoverage(
    subject.milestones.map((m) => ({
      weight: m.weight,
      isCompleted: m.isCompleted,
      doneTasks: m.tasks.filter((t) => t.isCompleted).length,
      totalTasks: m.tasks.length,
    })),
    { done, total },
  );
  const pace = subjectPace(subject, coverage);
  // With a target date the headline number is weighted syllabus coverage;
  // without one it stays plain task progress.
  const examMode = pace.status !== "none";
  const shown = examMode ? Math.round(coverage * 100) : pct;

  return (
    <div className="lk-hero px-4 py-3">
      <div className="flex items-end gap-4">
        <span className="lk-pct" title={examMode ? "Weighted syllabus coverage" : "Tasks done"}>
          {shown}%
        </span>
        <div className="flex-1 pb-1">
          <PaceBar
            coverage={shown / 100}
            elapsed={pace.elapsed}
            showMark={examMode && pace.status !== "done" && pace.status !== "overdue"}
          />
          <div className="lk-print mt-2 text-2xs uppercase tracking-wide text-muted-foreground">
            {done}/{total} tasks · {subject.milestones.length} notes · {subject.resources.length} resources
            {weak > 0 && <span style={{ color: "var(--destructive)" }}> · {weak} weak</span>}
            {toRevise > 0 && <span> · {toRevise} to revise</span>}
            {complete && <span className="text-ok"> · done</span>}
          </div>
          {examMode && subject.targetDate && pace.status !== "none" && (
            <div className="lk-print mt-1 text-2xs uppercase tracking-wide text-muted-foreground">
              target {countdown(subject.targetDate, pace.daysLeft)} ·{" "}
              <span style={{ color: PACE_META[pace.status].color }}>{PACE_META[pace.status].label}</span>
              {pace.status !== "done" && pace.status !== "overdue" && (
                <>
                  {" "}
                  · {Math.round(pace.elapsed * 100)}% of time gone
                  {pace.neededPerWeek !== null && <> · need {Math.ceil(pace.neededPerWeek * 100)}%/wk</>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
