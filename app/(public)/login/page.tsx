"use client";

import type React from "react";

import { Suspense, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { AuthShell, AuthBrand, GoogleMark } from "@/app/components/auth-shell";
import { Wordmark } from "@/app/components/brand/wordmark";
import { safeNext } from "@/lib/safe-next";
import { api } from "@/lib/fetcher";
import { EMAIL_NOT_VERIFIED, SIGN_IN_ERRORS, TOO_MANY_ATTEMPTS } from "@/lib/accounts/errors";
import { useAccountOptions } from "@/hooks/useAccount";

function LoginForm({ nextParam, errorParam }: { nextParam: string | null; errorParam: string | null }) {
  const next = safeNext(nextParam);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // A sign-in NextAuth turned away arrives as ?error= (a Google account it wouldn't attach, say).
  const [error, setError] = useState<string | null>(errorParam ? (SIGN_IN_ERRORS[errorParam] ?? null) : null);
  // The password was right but the address was never confirmed: offer the link again.
  const [unverified, setUnverified] = useState(false);
  const { data: options } = useAccountOptions();
  // Google shows only where it's configured (self-hosted copies often aren't).
  const { data: providers } = useQuery({ queryKey: ["auth-providers"], queryFn: getProviders, staleTime: Infinity });
  const googleEnabled = !!providers?.google;

  const loginMutation = useMutation({
    mutationFn: async () => {
      // redirect:false → signIn returns { ok, error } instead of doing its own
      // full-page redirect. Without it, a successful login still resolves to
      // undefined and trips the error path, flashing "Login failed" before the
      // redirect lands. We navigate manually in onSuccess.
      const result = await signIn("credentials", { redirect: false, email, password });
      if (result?.error === EMAIL_NOT_VERIFIED) throw new Error(EMAIL_NOT_VERIFIED);
      if (result?.error === TOO_MANY_ATTEMPTS) throw new Error("Too many sign-in tries. Wait ten minutes and try again.");
      if (!result?.ok || result.error) {
        throw new Error("Login failed. Please check your credentials.");
      }
      return result;
    },
    // A full load rather than a client navigation: `/` is a different page once
    // signed in (a rewrite on the session cookie), and the router here learned
    // it while signed out. The notebook loads its own scripts either way.
    onSuccess: () => window.location.assign(next),
    onError: (err: Error) => {
      if (err.message === EMAIL_NOT_VERIFIED) setUnverified(true);
      else setError(err.message);
    },
  });

  // Asks for the same email and password the form holds, so only someone who
  // can sign in to the account can have its link sent again.
  const resend = useMutation({
    mutationFn: () => api.post<{ sent: boolean }>("/api/account/verify/resend", { email, password }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    resend.reset();
    loginMutation.mutate();
  };

  return (
    <AuthShell>
      <AuthBrand
        heading="Open your notebook."
        copy="Your notes by subject, with everything you saved beside them."
      />

      <div className="w-full max-w-md">
        <div className="lk-card p-7">
          <Link href="/" className="lk-display mb-5 block text-2xl font-black tracking-tight lg:hidden">
            <Wordmark />
          </Link>
          <div className="mb-6">
            <h2 className="lk-display text-2xl font-black tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2" role="alert">
              <p className="lk-print text-xs text-destructive">{error}</p>
            </div>
          )}
          {unverified && (
            <div className="mb-5 rounded-md border border-border px-3 py-2.5 text-sm" role="status">
              <p>
                <b>Confirm your email first.</b> We sent a link to {email} when you signed up; open it and then sign in.
              </p>
              {resend.isSuccess ? (
                <p className="mt-1.5 text-muted-foreground">Sent. Links can be sent once a minute.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => resend.mutate()}
                  disabled={resend.isPending}
                  className="mt-1.5 font-semibold hover:underline disabled:opacity-50"
                >
                  {resend.isPending ? "Sending…" : "Send the link again"}
                </button>
              )}
              {resend.isError && <p className="mt-1.5 text-destructive">{resend.error.message}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="lk-sec mb-1.5 block">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="password" className="lk-sec block">Password</label>
                <Link href="/forgot" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="lk-iconbtn absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="lk-btn flex items-center justify-center gap-2 px-4 py-2.5 text-xs disabled:opacity-50"
            >
              {loginMutation.isPending ? "Signing in…" : <>Sign in <ArrowRight size={14} /></>}
            </button>
          </form>

          {googleEnabled && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: next })}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <GoogleMark /> Continue with Google
              </button>
            </>
          )}

          {options?.signup !== false && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href={nextParam ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-foreground hover:underline">Sign up</Link>
            </p>
          )}
        </div>
      </div>
    </AuthShell>
  );
}

// Prerendered. The static HTML is the form without `?next=` (where sign-in was
// interrupted, e.g. an app asking to connect); the copy that reads it takes
// over in the browser.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm nextParam={null} errorParam={null} />}>
      <LoginWithNext />
    </Suspense>
  );
}

function LoginWithNext() {
  const params = useSearchParams();
  return <LoginForm nextParam={params.get("next")} errorParam={params.get("error")} />;
}
