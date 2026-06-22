"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useUpdateSubject, useDeleteSubject } from "@/hooks/useSubjects";
import type { SubjectDetail } from "@/hooks/useSubjects";
import { SUBJECT_PALETTE } from "@/app/components/home/new-subject";

const FALLBACK = "#8b8f9e";

export function SubjectHeader({ subject }: { subject: SubjectDetail }) {
  const router = useRouter();
  const update = useUpdateSubject();
  const del = useDeleteSubject();

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(subject.title);
  const [description, setDescription] = useState(subject.description ?? "");
  const [color, setColor] = useState(subject.color ?? SUBJECT_PALETTE[0]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const milestoneTasks = subject.milestones.flatMap((m) => m.tasks);
  const allTasks = [...milestoneTasks, ...subject.tasks];
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.isCompleted).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update.mutate(
      {
        id: subject.id,
        data: { title: title.trim(), description: description.trim() || null, color },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const toggleArchive = () =>
    update.mutate({ id: subject.id, data: { isArchived: !subject.isArchived } });

  const remove = () =>
    del.mutate(subject.id, { onSuccess: () => router.push("/") });

  return (
    <header className="lk-subject" style={{ "--c": subject.color ?? FALLBACK } as React.CSSProperties}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="lk-mono flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={13} /> Subjects
        </Link>

        <div className="flex items-center gap-1">
          <Popover open={editOpen} onOpenChange={setEditOpen}>
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
                <button
                  type="submit"
                  disabled={update.isPending || !title.trim()}
                  className="lk-btn px-3 py-2 text-[10.5px] disabled:opacity-50"
                >
                  {update.isPending ? "Saving…" : "Save"}
                </button>
              </form>
            </PopoverContent>
          </Popover>

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
                  This permanently removes its milestones, tasks &amp; resources.
                </p>
                <button
                  type="button"
                  onClick={remove}
                  disabled={del.isPending}
                  className="lk-btn px-3 py-2 text-[10.5px] disabled:opacity-50"
                  style={{ background: "var(--destructive)", color: "#fff" }}
                >
                  {del.isPending ? "Deleting…" : "Delete forever"}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="lk-swatch" style={{ width: 22, height: 22 }} />
        <h1 className="lk-display text-2xl font-black tracking-tight md:text-3xl">{subject.title}</h1>
        {subject.isArchived && <span className="lk-tag">archived</span>}
      </div>

      {subject.description && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subject.description}</p>
      )}

      <div className="mt-5 flex items-end gap-4">
        <span className="lk-pct">{pct}%</span>
        <div className="flex-1 pb-1">
          <div className="lk-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="lk-mono mt-2 text-[10.5px] uppercase tracking-wide text-muted-foreground">
            {done}/{total} tasks · {subject.milestones.length} milestones · {subject.resources.length} resources
            {complete && <span className="text-ok"> · done</span>}
          </div>
        </div>
      </div>
    </header>
  );
}
