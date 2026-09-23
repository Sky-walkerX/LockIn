"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Sparkles, Terminal } from "lucide-react";
import { FocusSettings } from "@/app/components/focus/focus-settings";

const THEMES = [
  { value: "light", label: "Creative", hint: "light, bold", icon: Sparkles },
  { value: "dark", label: "Focus", hint: "dark, editor-calm", icon: Terminal },
  { value: "system", label: "System", hint: "follow the OS", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { data: session, status } = useSession({ required: true });
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored theme after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (status === "loading") {
    return (
      <main className="w-full px-4 py-10 sm:px-6 lg:px-10 xl:px-16">
        <p className="lk-mono text-sm text-muted-foreground">loading…</p>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
      <h1 className="lk-display mb-5 text-2xl font-black tracking-tight">Settings</h1>

      <div className="mx-auto flex max-w-2xl flex-col gap-7">
        <section>
          <div className="lk-sec mb-3">account</div>
          <div className="lk-card flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="truncate font-semibold">{session?.user?.name || "No name set"}</div>
              <div className="lk-mono truncate text-xs text-muted-foreground">{session?.user?.email}</div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="lk-mono flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </section>

        <section>
          <div className="lk-sec mb-3">appearance</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ value, label, hint, icon: Icon }) => {
              const active = mounted && theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(value)}
                  className={`lk-card flex items-center gap-3 p-4 text-left transition-colors ${
                    active ? "ring-2 ring-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={16} />
                  <span>
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="lk-mono block text-[11px]">{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="lk-sec mb-3">focus timer</div>
          <div className="lk-card p-4">
            <FocusSettings />
          </div>
        </section>
      </div>
    </main>
  );
}
