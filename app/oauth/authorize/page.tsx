import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BookOpenText, PenLine, ShieldAlert } from "lucide-react";
import { authOptions } from "@/lib/authOptions";
import { Wordmark } from "@/app/components/brand/wordmark";
import { AuthShell } from "@/app/components/auth-shell";
import { checkAuthorizeRequest, readParams } from "@/lib/oauth/authorize";
import { isMetadataDocumentId } from "@/lib/oauth/rules";
import { requestOrigin } from "@/lib/oauth/origin";
import { decide } from "./actions";

export const metadata: Metadata = { title: "Connect an app" };

// Where an app such as Claude.ai or ChatGPT asks for access to the notebook
// over MCP. Signed out, it sends the user to sign in and back. The page says
// who's asking, what they'll be able to do, and where the user goes next.
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readParams(await searchParams);
  const origin = await requestOrigin();
  const check = await checkAuthorizeRequest(params, origin);
  if (check.kind === "redirect") redirect(check.url);

  if (check.kind === "show-error") {
    return (
      <AuthShell>
        <div className="mx-auto w-full max-w-md">
          <div className="lk-card p-7">
            <Link href="/" className="mb-5 block text-2xl">
              <Wordmark />
            </Link>
            <h1 className="lk-page-title text-3xl">Can&apos;t connect this app</h1>
            <p className="mt-3 text-sm text-muted-foreground">{check.message}</p>
            <p className="mt-3 text-sm text-muted-foreground">Start again from the app you were connecting.</p>
          </div>
        </div>
      </AuthShell>
    );
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    const here = `/oauth/authorize?${new URLSearchParams(params as Record<string, string>)}`;
    redirect(`/login?next=${encodeURIComponent(here)}`);
  }

  const { client, redirectUri } = check;
  const back = new URL(redirectUri);
  const loopback = back.protocol === "http:";
  const verifiedBy = isMetadataDocumentId(client.id) ? new URL(client.id).hostname : null;

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <div className="lk-card p-7">
          <Link href="/" className="mb-5 block text-2xl">
            <Wordmark />
          </Link>
          <h1 className="lk-page-title text-3xl">Connect {client.name} to your notebook</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {verifiedBy ? (
              <>
                Identified by <b className="text-foreground">{verifiedBy}</b>.
              </>
            ) : (
              <>This app named itself &ldquo;{client.name}&rdquo;; LockIn can&apos;t check that name.</>
            )}{" "}
            Signed in as {session.user?.email}.
          </p>

          <p className="lk-print mt-6 text-2xs uppercase tracking-wide text-muted-foreground">{client.name} will be able to</p>
          <ul className="mt-2 space-y-2.5 text-sm">
            <li className="flex gap-2.5">
              <BookOpenText size={16} className="mt-0.5 flex-none text-muted-foreground" />
              <span>List your subjects, and search and read your notes.</span>
            </li>
            <li className="flex gap-2.5">
              <PenLine size={16} className="mt-0.5 flex-none text-muted-foreground" />
              <span>
                Save new notes and add to existing ones. They&apos;re marked as recorded by {client.name} until you witness
                them.
              </span>
            </li>
          </ul>

          <p className="mt-6 text-sm">
            After you allow it, you&apos;ll go back to{" "}
            <b>{loopback ? `an app on this computer (${back.host})` : back.host}</b>.
          </p>
          {loopback && (
            <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
              <ShieldAlert size={16} className="mt-0.5 flex-none" />
              Only allow this if you just started connecting from an app on this computer, like Claude Code.
            </p>
          )}

          <form action={decide} className="mt-6 flex items-center gap-2">
            {Object.entries(params).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button type="submit" name="decision" value="allow" className="lk-btn flex-1 px-4 py-2.5 text-xs">
              Allow
            </button>
            <button
              type="submit"
              name="decision"
              value="deny"
              className="rounded-md border border-border px-4 py-2.5 text-sm transition-colors hover:border-foreground"
            >
              Cancel
            </button>
          </form>
          <p className="mt-4 text-2xs text-muted-foreground">You can disconnect it any time in Settings.</p>
        </div>
      </div>
    </AuthShell>
  );
}
