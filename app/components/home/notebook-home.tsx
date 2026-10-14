"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useSubjects } from "@/hooks/useSubjects";
import { useClock } from "@/app/components/clock";
import { RuledBoxes } from "../notebook/ruled-boxes";
import { Contents } from "./contents";
import { BatonCard } from "./baton-card";
import { NeedsALook } from "./needs-a-look";
import { TodayStrip } from "./today-strip";
import { NewSubject } from "./new-subject";
import { Skeleton } from "../ui/skeleton";
import { TUTORIAL_TITLE } from "@/lib/accounts/tutorial-notes";

// The notebook's contents page: what `/` shows once you're signed in.
export function NotebookHome() {
  const { data: session, status } = useSession({ required: true });
  const { data: subjects, isLoading } = useSubjects();
  const clock = useClock();

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
  // Nothing of the owner's yet: no sections, or only the Tutorial a new
  // notebook comes with.
  const fresh = list.length === 0 || (list.length === 1 && list[0].title === TUTORIAL_TITLE);
  const owner = session?.user?.name || session?.user?.email?.split("@")[0] || "—";

  return (
    <main className="lk-page">
      <RuledBoxes
        items={[
          { label: "Owner", value: owner, grow: 2 },
          { label: "Sections", value: list.length },
          { label: "Notes", value: noteCount },
          { label: "Date", value: format(clock.now, "d MMM yyyy", { in: clock.in }), grow: 1.3 },
        ]}
      />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="contents-h" className="lk-page-title">Contents</h1>
          <p className="lk-page-sub">
            {list.length === 0
              ? "An empty notebook. Start a section for the first thing you're learning."
              : fresh
                ? "A new notebook. Read the Tutorial, then start a section for the first thing you're learning."
                : `${noteCount} note${noteCount === 1 ? "" : "s"} across ${list.length} section${list.length === 1 ? "" : "s"}, most recent first.`}
          </p>
        </div>
        {fresh && (
          <div className="flex flex-wrap items-center gap-3">
            <NewSubject />
            <Link href="/settings#agents" className="text-ui text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Connect an agent
            </Link>
          </div>
        )}
      </header>

      <BatonCard />
      <NeedsALook />
      <TodayStrip />

      {list.length > 0 && <Contents />}
    </main>
  );
}
