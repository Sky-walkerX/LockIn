"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Checkbox } from "@/app/components/ui/checkbox";
import { AuthShell, AuthBrand } from "@/app/components/auth-shell";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to register");
      } else {
        setSuccess(data.message || "Registration successful! Please log in.");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthBrand
        heading="Build your study hub."
        copy="One place for every subject — plans, milestones, tasks and saved resources."
      />

      <div className="w-full max-w-md">
        <div className="lk-card p-7">
          <Link href="/" className="lk-display mb-5 block text-2xl font-black tracking-tight lg:hidden">
            Lock<span className="lk-brand-mark">In</span>
          </Link>
          <div className="mb-6">
            <h2 className="lk-display text-2xl font-black tracking-tight">Create account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Start collecting your subjects.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
              <p className="lk-mono text-xs text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-5 rounded-md border px-3 py-2" style={{ borderColor: "var(--lk-ok)", background: "color-mix(in srgb, var(--lk-ok) 12%, transparent)" }}>
              <p className="lk-mono text-xs" style={{ color: "var(--lk-ok)" }}>{success}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <Field id="name" label="Full name">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </Field>

            <Field id="email" label="Email">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </Field>

            <Field id="password" label="Password">
              <PasswordInput id="password" value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} placeholder="Create a password" />
            </Field>

            <Field id="confirmPassword" label="Confirm password">
              <PasswordInput id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPassword} setShow={setShowConfirmPassword} placeholder="Repeat password" />
            </Field>

            <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <Checkbox checked={acceptTerms} onCheckedChange={(c) => setAcceptTerms(c === true)} className="lk-check mt-0.5" />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-foreground hover:underline">Terms</Link> and{" "}
                <Link href="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="lk-btn px-4 py-2.5 text-xs disabled:opacity-50"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-foreground hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="lk-sec mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  setShow,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="lk-iconbtn absolute right-1 top-1/2 -translate-y-1/2"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}
