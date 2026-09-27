"use client";

import { useMounted } from "@/hooks/useMounted";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Skeleton } from "@/app/components/ui/skeleton";

const THEMES = [
  { value: "light", label: "Light", hint: "white paper", icon: Sun },
  { value: "dark", label: "Dark", hint: "slate paper", icon: Moon },
  { value: "system", label: "System", hint: "follow the OS", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { data: session, status } = useSession({ required: true });
  const { theme, setTheme } = useTheme();
  // next-themes only knows the stored theme after hydration.
  const mounted = useMounted();

  if (status === "loading") {
    return (
      <main className="lk-page">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  return (
    <main className="lk-page">
      <header>
        <h1 className="lk-page-title">Settings</h1>
        <p className="lk-page-sub">Your account, the paper you read on, and your data.</p>
      </header>

      <div className="flex max-w-2xl flex-col gap-7">
        <section>
          <div className="lk-sec mb-3">account</div>
          <div className="lk-card flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="truncate font-semibold">{session?.user?.name || "No name set"}</div>
              <div className="lk-print truncate text-xs text-muted-foreground">{session?.user?.email}</div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="lk-print flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-2xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
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
                    <span className="lk-print block text-2xs">{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
