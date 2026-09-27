"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSubject } from "@/hooks/useSubjects";
import { SubjectHeader } from "@/app/components/subject/subject-header";
import { Skeleton } from "@/app/components/ui/skeleton";

const FALLBACK = "#8b8f9e";

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const { status } = useSession({ required: true });
  const { data: subject, isLoading, isError } = useSubject(id);

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

  return (
    <main className="lk-page lk-subject" style={{ "--c": subject.color ?? FALLBACK } as React.CSSProperties}>
      <SubjectHeader subject={subject} />
    </main>
  );
}
