import Link from "next/link";
import type { SubjectWithProgress } from "@/hooks/useSubjects";

const FALLBACK = "#8b8f9e";

export function SubjectCard({ subject }: { subject: SubjectWithProgress }) {
  const total = subject.totalTasks;
  const done = subject.completedTasks;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const color = subject.color ?? FALLBACK;
  const complete = total > 0 && done === total;
  const status = total === 0 ? "no tasks" : complete ? "done" : "in progress";

  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="lk-card lk-subject flex flex-col gap-2.5 p-3.5 transition-transform hover:-translate-y-0.5"
      style={{ "--c": color } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="lk-swatch" />
          <h3 className="lk-display truncate text-[15px] font-extrabold tracking-tight">{subject.title}</h3>
        </div>
        <span className={`lk-mono text-[9.5px] font-bold uppercase tracking-wide ${complete ? "text-ok" : "text-muted-foreground"}`}>
          {status}
        </span>
      </div>

      <span className="lk-pct">{pct}%</span>
      <div className="lk-bar">
        <i style={{ width: `${pct}%` }} />
      </div>

      <div className="lk-mono text-[10.5px] font-bold uppercase tracking-wide">
        {subject._count.milestones} milestones · {total} tasks
      </div>
      <div className="lk-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">
        {subject._count.resources} resources
      </div>
    </Link>
  );
}
