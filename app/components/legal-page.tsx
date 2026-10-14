import type React from "react";
import Link from "next/link";
import { Wordmark } from "@/app/components/brand/wordmark";
import type { Operator } from "@/lib/operator";

// The frame the privacy and terms pages share: grid paper, one reading column,
// who runs the instance and when the page last changed.
export function LegalPage({
  title,
  updated,
  operator,
  other,
  children,
}: {
  title: string;
  /** The day the page's wording last changed, as it should read. */
  updated: string;
  operator: Operator;
  other: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="lk-paper min-h-screen">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/" className="text-2xl">
          <Wordmark />
        </Link>
        <article className="lk-card mt-8 p-7 sm:p-10">
          <h1 className="lk-page-title text-3xl">{title}</h1>
          <p className="lk-print mt-2 text-xs text-muted-foreground">
            Last changed {updated}
            {operator.name ? ` · run by ${operator.name}` : ""}
          </p>
          <div className="lk-reading mt-6">
            <div className="lk-prose">{children}</div>
          </div>
        </article>
        <p className="lk-print mt-6 text-xs text-muted-foreground">
          <Link href={other.href} className="underline underline-offset-2">
            {other.label}
          </Link>{" "}
          ·{" "}
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}

/** The operator's address as a link, for "write to …". */
export function Contact({ operator }: { operator: Operator }) {
  return <a href={`mailto:${operator.email}`}>{operator.email}</a>;
}
