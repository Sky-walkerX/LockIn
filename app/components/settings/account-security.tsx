"use client";

import type React from "react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { useAccount } from "@/hooks/useAccount";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";

// Settings: change the password (or set a first one on an account that signs
// in with Google), and delete the account. Both end this session.
export function AccountSecurity() {
  const { data: account } = useAccount();
  if (!account) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="flex flex-col gap-3">
      <PasswordCard hasPassword={account.hasPassword} />
      <DeleteCard email={account.email} hasPassword={account.hasPassword} />
    </div>
  );
}

function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const change = useMutation({
    mutationFn: () => api.post("/api/account/password", { current: hasPassword ? current : undefined, password }),
    // Every session ended with the old password, this one too.
    onSuccess: () => signOut({ callbackUrl: "/login" }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMismatch(password !== again);
    if (password === again) change.mutate();
  };

  return (
    <form onSubmit={submit} className="lk-card flex flex-col gap-3 p-4">
      <div>
        <div className="font-semibold">{hasPassword ? "Change password" : "Set a password"}</div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {hasPassword
            ? "You'll be signed out everywhere, here included, and sign in again with the new one."
            : "You sign in with Google. A password lets you sign in with your email as well."}
        </p>
      </div>
      {hasPassword && (
        <div>
          <label htmlFor="current-password" className="lk-sec mb-1.5 block">
            Current password
          </label>
          <Input id="current-password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="lk-sec mb-1.5 block">
            New password
          </label>
          <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        <div>
          <label htmlFor="new-password-again" className="lk-sec mb-1.5 block">
            Repeat it
          </label>
          <Input id="new-password-again" type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
      </div>
      {mismatch && <p className="lk-print text-xs text-destructive">Passwords do not match</p>}
      {change.isError && <p className="lk-print text-xs text-destructive">{change.error.message}</p>}
      <div>
        <button type="submit" disabled={change.isPending || change.isSuccess} className="lk-btn px-3 py-2 text-2xs disabled:opacity-50">
          {change.isPending || change.isSuccess ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </button>
      </div>
    </form>
  );
}

function DeleteCard({ email, hasPassword }: { email: string; hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const matches = confirm.trim().toLowerCase() === email.toLowerCase() && (!hasPassword || password.length > 0);

  const remove = useMutation({
    mutationFn: () =>
      fetch("/api/account", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, password: hasPassword ? password : undefined }),
      }).then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't delete the account");
      }),
    onSuccess: () => signOut({ callbackUrl: "/" }),
  });

  return (
    <div className="lk-card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold">Delete account</div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Removes your notebook for good: every subject, note, plan, file, chat and share link, and every agent&apos;s
            access. Export first if you want a copy.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="lk-print shrink-0 rounded-md border border-destructive/50 px-2.5 py-1.5 text-2xs uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete account…
          </button>
        )}
      </div>
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (matches) remove.mutate();
          }}
          className="flex flex-col gap-3"
        >
          <div>
            <label htmlFor="delete-confirm" className="lk-sec mb-1.5 block">
              Type {email} to confirm
            </label>
            <Input id="delete-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          </div>
          {hasPassword && (
            <div>
              <label htmlFor="delete-password" className="lk-sec mb-1.5 block">
                Your password
              </label>
              <Input id="delete-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
          )}
          {remove.isError && <p className="lk-print text-xs text-destructive">{remove.error.message}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!matches || remove.isPending || remove.isSuccess}
              className="lk-print rounded-md bg-destructive px-3 py-2 text-2xs uppercase tracking-wide text-white disabled:opacity-40"
            >
              {remove.isPending || remove.isSuccess ? "Deleting…" : "Delete my notebook for good"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setPassword("");
              }}
              className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
