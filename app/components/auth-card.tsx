import type React from "react";
import Link from "next/link";
import { Wordmark } from "@/app/components/brand/wordmark";
import { AuthShell } from "@/app/components/auth-shell";

// The single card the smaller account pages use (confirm an address, ask for a
// reset link, set a new password), in the frame of the sign-in pages.
export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <div className="lk-card p-7">
          <Link href="/" className="mb-5 block text-2xl">
            <Wordmark />
          </Link>
          <h1 className="lk-page-title text-3xl">{title}</h1>
          {children}
        </div>
      </div>
    </AuthShell>
  );
}

/** A refusal or a failure, in the red the sign-in form uses. */
export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2" role="alert">
      <p className="lk-print text-xs text-destructive">{children}</p>
    </div>
  );
}
