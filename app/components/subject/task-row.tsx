"use client";

import { useState } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import type { Task, Priority } from "@/app/generated/prisma";

const PRIORITY_COLOR: Record<Priority, string> = {
  HIGH: "var(--destructive)",
  MEDIUM: "var(--lk-warn)",
  LOW: "var(--muted-foreground)",
};

export function TaskRow({ task }: { task: Task }) {
  const update = useUpdateTask();
  const del = useDeleteTask();

  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [due, setDue] = useState(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !task.isCompleted && dueDate ? isBefore(dueDate, startOfDay(new Date())) : false;

  const toggle = () =>
    update.mutate({ id: task.id, data: { isCompleted: !task.isCompleted } });

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    update.mutate(
      {
        id: task.id,
        data: {
          title: title.trim(),
          priority,
          dueDate: due ? new Date(`${due}T00:00:00`).toISOString() : null,
        },
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  return (
    <div className="group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/60">
      <Checkbox checked={task.isCompleted} onCheckedChange={toggle} className="lk-check" />

      <span
        className={`flex-1 truncate text-sm ${task.isCompleted ? "text-muted-foreground line-through" : ""}`}
      >
        {task.title}
      </span>

      {task.priority !== "MEDIUM" && (
        <span
          className="lk-mono text-[9px] font-bold uppercase tracking-wide"
          style={{ color: PRIORITY_COLOR[task.priority] }}
        >
          {task.priority}
        </span>
      )}

      {dueDate && (
        <span className={`lk-mono text-[10px] uppercase ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
          {overdue ? "overdue · " : ""}
          {format(dueDate, "dd MMM")}
        </span>
      )}

      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
        <Popover open={editOpen} onOpenChange={setEditOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="lk-iconbtn" title="Edit task">
              <Pencil size={13} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <form onSubmit={saveEdit} className="flex flex-col gap-3">
              <div className="lk-sec">Edit task</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task" />
              <div className="flex gap-2">
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="flex-1" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="flex-1"
                />
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
          onClick={() => del.mutate(task.id)}
          disabled={del.isPending}
          className="lk-iconbtn hover:text-destructive"
          title="Delete task"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
