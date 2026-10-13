"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { AuthCard, AuthError } from "@/app/components/auth-card";

// Where the link in a confirmation email opens. Opening it confirms nothing:
// the address is confirmed when its owner presses the button, so a mail
// scanner that follows links can't do it for them.
function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);

  const check = useQuery({
    queryKey: ["verify-link", token],
    queryFn: () => api.get<{ valid: boolean }>(`/api/account/verify?token=${encodeURIComponent(token)}`),
    enabled: !!token && !done,
    staleTime: Infinity,
    retry: false,
  });
  const confirm = useMutation({
    mutationFn: () => api.post<{ email: string }>("/api/account/verify", { token }),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <AuthCard title="Address confirmed">
        <p className="mt-3 text-sm text-muted-foreground">Your notebook is ready. Sign in to open it.</p>
        <Link href="/login" className="lk-btn mt-6 inline-block px-4 py-2.5 text-xs">
          Sign in
        </Link>
      </AuthCard>
    );
  }

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
        One step left: confirm that this address is yours, and your notebook is ready.
      </p>
      {confirm.isError && <AuthError>{confirm.error.message}</AuthError>}
      <button
        type="button"
        onClick={() => confirm.mutate()}
        disabled={check.isPending || confirm.isPending}
        className="lk-btn mt-6 px-4 py-2.5 text-xs disabled:opacity-50"
      >
        {confirm.isPending ? "Confirming…" : "Confirm my address"}
      </button>
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
