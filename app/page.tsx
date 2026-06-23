"use client";

import { useSession } from "next-auth/react";
import { useSubjects } from "@/hooks/useSubjects";
import { SubjectCard } from "./components/home/subject-card";
import { TodayPanel } from "./components/home/today-panel";
import { NewSubject } from "./components/home/new-subject";

export default function HomePage() {
  const { status } = useSession({ required: true });
  const { data, isLoading } = useSubjects();

  if (status === "loading") {
    return (
      <main className="w-full px-4 py-10 sm:px-6 lg:px-10 xl:px-16">
        <p className="lk-mono text-sm text-muted-foreground">loading…</p>
      </main>
    );
  }

  const list = data ?? [];
  const activeTasks = list.reduce((n, s) => n + (s.totalTasks - s.completedTasks), 0);

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="lk-display text-2xl font-black tracking-tight">Your subjects</h1>
        <NewSubject />
      </div>

      <TodayPanel />

      <div className="lk-sec mt-7 mb-3">subjects · {list.length}</div>

      {isLoading ? (
        <p className="lk-mono text-sm text-muted-foreground">loading subjects…</p>
      ) : list.length === 0 ? (
        <div className="lk-card p-8 text-center">
          <p className="lk-display text-lg font-bold">No subjects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first subject to start collecting plans &amp; resources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {list.map((s) => (
            <SubjectCard key={s.id} subject={s} />
          ))}
        </div>
      )}

      <div className="lk-statusbar mt-10">
        <span className="seg mode">LOCKIN</span>
        <span className="seg">{list.length} subjects</span>
        <span className="seg">{activeTasks} active tasks</span>
        <span className="seg grow" />
        <span className="seg">~/lockin</span>
      </div>
    </main>
  );
}
