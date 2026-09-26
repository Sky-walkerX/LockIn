"use client";

import { format } from "date-fns";
import { Check, Repeat } from "lucide-react";
import type { Priority } from "@/app/generated/prisma";
import type { SharedNode } from "@/lib/share/tree";
import { Markdown } from "@/app/components/subject/markdown";

const PRIORITY_COLOR: Record<Priority, string> = {
  HIGH: "var(--destructive)",
  MEDIUM: "var(--lk-warn)",
  LOW: "var(--muted-foreground)",
};

/**
 * One node of a shared tree, rendered read-only.
 *
 * The owner-facing rows (TaskRow, SubtaskRow, MilestoneItem) are wired to
 * mutations, drag-and-drop and popovers; none of that can work without a
 * session, so this is a separate presentational component rather than those
 * rows with their controls conditionally removed. Everything here is static
 * markup: no checkbox a viewer can click, no edit affordance to hide.
 */
export function SharedNodeView({ node, depth }: { node: SharedNode; depth: number }) {
  const due = node.dueDate ? new Date(node.dueDate) : null;
  const isMilestone = node.kind === "milestone";
  const done = node.isCompleted === true;

  return (
    <div className={depth > 0 ? "lk-tsub" : undefined} data-depth={Math.min(depth + 1, 3)}>
      <div className="lk-trow flex items-start gap-2 rounded-r-md py-1.5 pr-1">
        {/* Completion is shown, never offered — a square that is filled or not. */}
        <span
          aria-hidden
          className={`mt-0.5 flex h-3.5 w-3.5 flex-none items-center justify-center rounded-[3px] border ${
            done ? "border-transparent bg-[var(--c)] text-background" : "border-border"
          }`}
        >
          {done && <Check size={10} strokeWidth={3} />}
        </span>
        <span className="sr-only">{done ? "Completed:" : "Not completed:"}</span>

        <span
          className={`min-w-0 flex-1 text-sm ${isMilestone ? "lk-display font-bold" : "lk-mono"} ${
            done ? "text-muted-foreground line-through" : ""
          }`}
        >
          {node.title}
        </span>

        {node.priority && node.priority !== "MEDIUM" && (
          <span
            className="lk-mono flex-none pt-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ color: PRIORITY_COLOR[node.priority] }}
          >
            {node.priority}
          </span>
        )}

        {node.recurrence && (
          <span
            className="lk-mono inline-flex flex-none items-center gap-0.5 pt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground"
            title={`Repeats ${node.recurrence.toLowerCase()}`}
          >
            <Repeat size={10} />
            {node.recurrence.toLowerCase()}
          </span>
        )}

        {due && (
          <span className="lk-mono flex-none pt-0.5 text-[10px] uppercase text-muted-foreground">
            {format(due, "dd MMM")}
          </span>
        )}
      </div>

      {node.notes && (
        <div className="lk-tsub mb-1 mr-1 pb-1" data-depth={Math.min(depth + 2, 3)}>
          <div className="rounded-md bg-muted/40 p-2.5">
            <Markdown>{node.notes}</Markdown>
          </div>
        </div>
      )}

      {node.children.map((child) => (
        <SharedNodeView key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
