import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadShare } from "@/lib/share/load";
import { SharedView } from "@/app/components/share/shared-view";

// Rendered per request: a revoked link has to stop working the moment it is
// revoked, which a statically cached page could not honour.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const payload = await loadShare(token);
  if (!payload) return { title: "Link not found · LockIn" };

  return {
    title: `${payload.root.title} · LockIn`,
    description: payload.breadcrumb.join(" › ") || undefined,
    // Shared links are unlisted, not published — keep them out of search results.
    robots: { index: false, follow: false },
  };
}

/**
 * The public, login-free view of a shared record.
 *
 * A server component reading the database directly rather than a client
 * component fetching `/api/public/[token]`: there is no session to wait for and
 * nothing interactive on the page, so the viewer gets rendered HTML in one hop.
 * The API route stays for programmatic access to the same payload.
 */
export default async function SharePage({ params }: Props) {
  const { token } = await params;
  const payload = await loadShare(token);

  // A real 404 status, not a 200 carrying an apology: monitoring and crawlers
  // read the status line, and `not-found.tsx` still renders the friendly page.
  if (!payload) notFound();

  return <SharedView payload={payload} />;
}
