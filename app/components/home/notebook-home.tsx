"use client";

import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useSubjects } from "@/hooks/useSubjects";
import { RuledBoxes } from "../notebook/ruled-boxes";
import { Contents } from "./contents";
import { NewSubject } from "./new-subject";
import { Skeleton } from "../ui/skeleton";

// The notebook's contents page: what `/` shows once you're signed in.
export function NotebookHome() {
  const { data: session, status } = useSession({ required: true });
  const { data: subjects, isLoading } = useSubjects();

  if (status === "loading" || isLoading) {
    return (
      <main className="lk-page">
        <Skeleton className="h-[58px] w-full" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  const list = subjects ?? [];
  const noteCount = list.reduce((n, s) => n + s._count.milestones, 0);
  const owner = session?.user?.name || session?.user?.email?.split("@")[0] || "—";

  return (
    <main className="lk-page">
      <RuledBoxes
        items={[
          { label: "Owner", value: owner, grow: 2 },
          { label: "Sections", value: list.length },
          { label: "Notes", value: noteCount },
          { label: "Date", value: format(new Date(), "d MMM yyyy"), grow: 1.3 },
        ]}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="contents-h" className="lk-page-title">Contents</h1>
          <p className="lk-page-sub">
            {list.length === 0
              ? "An empty notebook. Start a section for the first thing you're learning."
              : `${noteCount} note${noteCount === 1 ? "" : "s"} across ${list.length} section${list.length === 1 ? "" : "s"}, most recent first.`}
          </p>
        </div>
        {list.length === 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <NewSubject />
          </div>
        )}
      </header>

      {list.length > 0 && <Contents />}
    </main>
  );
}
