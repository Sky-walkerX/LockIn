"use client";

import { useEffect } from "react";
import Link from "next/link";

// Shown in place of a page that threw while rendering. The notebook's frame
// above it stays, and "Try again" re-fetches and re-renders the page.
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] w-full flex-col items-center justify-center px-5 py-20 text-center">
      <p className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">Something went wrong</p>
      <h1 className="lk-display mt-2 text-2xl font-bold">This page couldn&apos;t be shown</h1>
      <p className="mt-2 max-w-sm font-reading text-muted-foreground">
        Your notes are as you left them. Trying again usually clears it.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <button type="button" onClick={() => retry()} className="lk-btn px-3 py-2 text-2xs">
          Try again
        </button>
        <Link href="/" className="lk-print rounded-md border border-border px-3 py-2 text-2xs uppercase tracking-wide text-muted-foreground hover:text-foreground">
          Back to the contents
        </Link>
      </div>
      {/* What the server logged it under, for whoever runs this instance. */}
      {error.digest && <p className="lk-print mt-6 text-2xs text-muted-foreground">Reference {error.digest}</p>}
    </main>
  );
}
