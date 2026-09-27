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
import { format } from "date-fns";
import { RuledBoxes } from "@/app/components/notebook/ruled-boxes";

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

  // Re-seed the draft fields every time the popover opens so an edit started
  // after a background refetch shows current values, not mount-time ones.
  const openEdit = (o: boolean) => {
    if (o) {
      setTitle(subject.title);
      setDescription(subject.description ?? "");
      setColor(subject.color ?? SUBJECT_PALETTE[0]);
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
                  This permanently removes its notes and tasks.
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
