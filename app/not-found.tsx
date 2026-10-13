import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

// Any address that matches nothing. A note or subject that isn't the
// viewer's lands here too, so it reads the same as one that never existed.
export default function NotFound() {
  return (
    <main className="lk-paper flex min-h-screen flex-col items-center justify-center px-5 py-20 text-center">
      <p className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">Page not found</p>
      <h1 className="lk-display mt-2 text-2xl font-bold">This page isn&apos;t in the notebook</h1>
      <p className="mt-2 max-w-sm font-reading text-muted-foreground">
        The address may be mistyped, or what it pointed to was moved or deleted.
      </p>
      <Link href="/" className="lk-btn mt-6 inline-block px-3 py-2 text-2xs">
        Back to the contents
      </Link>
    </main>
  );
}
