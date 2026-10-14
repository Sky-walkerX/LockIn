import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { operator } from "@/lib/operator";
import { Contact, LegalPage } from "@/app/components/legal-page";

// Rendered per request, and only where an operator is named: see the privacy page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Terms · ${BRAND.name}` };

// What using this instance comes with. Kept short and in plain words.
export default function TermsPage() {
  const who = operator();
  if (!who) notFound();
  const runner = who.name ?? "its operator";

  return (
    <LegalPage title="Terms" updated="14 October 2026" operator={who} other={{ href: "/privacy", label: "Privacy" }}>
      <p>
        This notebook is a copy of {BRAND.name} run by {runner}. Using it means agreeing to what is on this page.{" "}
        {BRAND.name} itself is open source under AGPL-3.0: the <a href={BRAND.repoUrl}>source</a> is public, and you
        are free to run your own copy instead, where none of this applies.
      </p>

      <h2>Your account</h2>
      <p>
        An account is for one person. Keep its password and its agent tokens to yourself. What an agent or app does
        with a token you gave it counts as done by you.
      </p>

      <h2>Your notes are yours</h2>
      <p>
        Nothing here gives {runner} any right to what you write or upload. It is stored and processed only to run
        your notebook, as the <Link href="/privacy">privacy page</Link> describes. You can export all of it, or delete
        it, at any time from Settings.
      </p>

      <h2>What is not allowed</h2>
      <ul>
        <li>Storing or sharing anything illegal, or anything that harms other people.</li>
        <li>Using uploads or shared links to host files for the public.</li>
        <li>Trying to get into other people&apos;s notebooks, or to get around the limits on storage and requests.</li>
        <li>Making accounts with a script, or wearing the service out on purpose.</li>
      </ul>
      <p>An account that does these things may be suspended or removed.</p>

      <h2>No promises about the service</h2>
      <p>
        This notebook is offered free of charge and as it is. It may be slow, unavailable, changed or shut down, and
        although it is backed up, no backup is certain. Export what matters to you. As far as the law allows,{" "}
        {runner} is not liable for loss that comes from using it or from not being able to. If the service is going to
        close, you will be told ahead of time where that is possible, so that you can take your notebook with you.
      </p>

      <h2>Leaving</h2>
      <p>
        Delete your account in Settings whenever you like. It takes the notebook, its files and every agent&apos;s
        access with it.
      </p>

      <h2>Changes and questions</h2>
      <p>
        These terms may change, and the date at the top says when they last did. Carrying on using the notebook after
        a change means agreeing to it. Questions go to <Contact operator={who} />.
      </p>
    </LegalPage>
  );
}
