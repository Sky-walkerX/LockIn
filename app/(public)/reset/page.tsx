"use client";

import type React from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { Input } from "@/app/components/ui/input";
import { AuthCard, AuthError } from "@/app/components/auth-card";

// Where the link in a reset email opens: set a new password.
function Reset() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const check = useQuery({
    queryKey: ["reset-link", token],
    queryFn: () => api.get<{ valid: boolean }>(`/api/account/reset?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  });
  const reset = useMutation({
    mutationFn: () => api.post<{ email: string; disconnected: number }>("/api/account/reset", { token, password }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMismatch(password !== again);
    if (password === again) reset.mutate();
  };

  if (reset.isSuccess) {
    return (
      <AuthCard title="Password changed">
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with your new password. Anywhere you were signed in before has been signed out.
        </p>
        {reset.data.disconnected > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Your agents and connected apps were disconnected too, in case someone else had been in. Connect them again
            in Settings.
          </p>
        )}
        <Link href="/login" className="lk-btn mt-6 inline-block px-4 py-2.5 text-xs">
          Sign in
        </Link>
      </AuthCard>
    );
  }

  if (!token || check.data?.valid === false || check.isError) {
    return (
      <AuthCard title="This link has expired">
        <p className="mt-3 text-sm text-muted-foreground">Reset links work once, for one hour.</p>
        <Link href="/forgot" className="lk-btn mt-6 inline-block px-4 py-2.5 text-xs">
          Send a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password">
      {mismatch && <AuthError>Passwords do not match</AuthError>}
      {reset.isError && <AuthError>{reset.error.message}</AuthError>}
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="lk-sec mb-1.5 block">
            New password
          </label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label htmlFor="again" className="lk-sec mb-1.5 block">
            Repeat it
          </label>
          <Input id="again" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        <button type="submit" disabled={check.isPending || reset.isPending} className="lk-btn px-4 py-2.5 text-xs disabled:opacity-50">
          {reset.isPending ? "Saving…" : "Set password"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<AuthCard title="Set a new password">{null}</AuthCard>}>
      <Reset />
    </Suspense>
  );
}
