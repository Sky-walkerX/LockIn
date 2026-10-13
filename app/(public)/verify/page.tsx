"use client";

import type React from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { Input } from "@/app/components/ui/input";
import { AuthCard, AuthError } from "@/app/components/auth-card";

// Where the link in a confirmation email opens. Confirming takes the account's
// password as well: the link shows its holder reads the inbox, the password
// that they're the one who signed up. Someone else's sign-up with this address
// can't be confirmed by the address's owner pressing a button.
function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");

  const check = useQuery({
    queryKey: ["verify-link", token],
    queryFn: () => api.get<{ valid: boolean }>(`/api/account/verify?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  });
  const confirm = useMutation({
    mutationFn: async () => {
      const { email } = await api.post<{ email: string }>("/api/account/verify", { token, password });
      // The same two things sign in, so the notebook opens without asking again.
      const signedIn = await signIn("credentials", { redirect: false, email, password });
      return { signedIn: !!signedIn?.ok && !signedIn.error };
    },
    // A full load, not a client navigation: `/` is a different page once
    // signed in (a rewrite on the session cookie), and the router here learned
    // it while signed out.
    onSuccess: ({ signedIn }) => {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (signedIn) window.location.assign("/");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm.mutate();
  };

  if (confirm.isSuccess) {
    return (
      <AuthCard title="Address confirmed">
        <p className="mt-3 text-sm text-muted-foreground">
          {confirm.data.signedIn ? "Opening your notebook…" : "Your notebook is ready. Sign in to open it."}
        </p>
        {!confirm.data.signedIn && (
          <Link href="/login" className="lk-btn mt-6 inline-block px-4 py-2.5 text-xs">
            Sign in
          </Link>
        )}
      </AuthCard>
    );
  }

  // Checked against the first answer only: once confirmed, the link is spent.
  if (!token || check.data?.valid === false || check.isError) {
    return (
      <AuthCard title="This link has expired">
        <p className="mt-3 text-sm text-muted-foreground">
          Confirmation links work once, for 24 hours. Sign in with your email and password and LockIn offers to send a
          new one.
        </p>
        <Link href="/login" className="lk-btn mt-6 inline-block px-4 py-2.5 text-xs">
          Sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Confirm your email">
      <p className="mt-3 text-sm text-muted-foreground">
        One step left. Enter the password you signed up with to confirm this address is yours.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Didn&apos;t sign up? Close this page: nothing is confirmed, and the account can&apos;t be used.
      </p>
      {confirm.isError && <AuthError>{confirm.error.message}</AuthError>}
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="lk-sec mb-1.5 block">
            Password
          </label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <button type="submit" disabled={check.isPending || confirm.isPending} className="lk-btn px-4 py-2.5 text-xs disabled:opacity-50">
          {confirm.isPending ? "Confirming…" : "Confirm and open my notebook"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AuthCard title="Confirm your email">{null}</AuthCard>}>
      <Verify />
    </Suspense>
  );
}
