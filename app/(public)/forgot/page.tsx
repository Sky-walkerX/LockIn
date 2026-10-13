"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { useAccountOptions } from "@/hooks/useAccount";
import { Input } from "@/app/components/ui/input";
import { AuthCard, AuthError } from "@/app/components/auth-card";

// Ask for a link that sets a new password. The page says the same thing
// whether or not the address has a notebook.
export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const { data: options } = useAccountOptions();
  const request = useMutation({
    mutationFn: () => api.post<{ sent: boolean }>("/api/account/reset/request", { email }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    request.mutate();
  };

  if (request.isSuccess) {
    return (
      <AuthCard title="Check your email">
        <p className="mt-3 text-sm text-muted-foreground">
          If <b className="text-foreground">{email}</b> has a notebook, a link to set a new password is on its way. It
          works for one hour.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold hover:underline">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  if (options && !options.mail) {
    return (
      <AuthCard title="Reset your password">
        <p className="mt-3 text-sm text-muted-foreground">
          This notebook isn&apos;t set up to send email, so it can&apos;t send a reset link. Whoever runs it can set a
          new password for you.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold hover:underline">
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Reset your password">
      <p className="mt-3 text-sm text-muted-foreground">Enter your address and LockIn emails a link to set a new one.</p>
      {request.isError && <AuthError>{request.error.message}</AuthError>}
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="lk-sec mb-1.5 block">
            Email
          </label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <button type="submit" disabled={request.isPending} className="lk-btn px-4 py-2.5 text-xs disabled:opacity-50">
          {request.isPending ? "Sending…" : "Send the link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
