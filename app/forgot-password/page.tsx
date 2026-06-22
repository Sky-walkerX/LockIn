"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { AuthShell } from "@/app/components/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.message || "Failed to send reset email");
      else setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="lk-display text-3xl font-black tracking-tight">
            Lock<span className="lk-brand-mark">In</span>
          </Link>
        </div>

        <div className="lk-card p-7">
          {!isSuccess ? (
            <>
              <div className="mb-6">
                <h2 className="lk-display text-2xl font-black tracking-tight">Reset password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <p className="lk-mono text-xs text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="email" className="lk-sec mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="lk-btn px-4 py-2.5 text-xs disabled:opacity-50">
                  {isLoading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--lk-ok) 18%, transparent)" }}
              >
                <CheckCircle2 size={26} style={{ color: "var(--lk-ok)" }} />
              </div>
              <h2 className="lk-display text-xl font-black tracking-tight">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;ve sent a reset link to <strong className="text-foreground">{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="lk-mono mt-5 text-[11px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="lk-mono inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
