"use client";

import { getProviders, signIn } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { GoogleMark } from "@/app/components/auth-shell";

// "Continue with Google" under the sign-in and sign-up forms, after an "or".
// Google signs in to the account with that address, or makes one, so the same
// button serves both pages. It shows only where Google is configured
// (self-hosted copies often aren't).
export function GoogleSignIn({ callbackUrl }: { callbackUrl: string }) {
  const { data: providers } = useQuery({ queryKey: ["auth-providers"], queryFn: getProviders, staleTime: Infinity });
  if (!providers?.google) return null;
  return (
    <>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        <GoogleMark /> Continue with Google
      </button>
    </>
  );
}
