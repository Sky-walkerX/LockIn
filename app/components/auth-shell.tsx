import type React from "react";
import Link from "next/link";
import { Bot, MessageSquareQuote, NotebookPen } from "lucide-react";
import { Wordmark } from "@/app/components/brand/wordmark";
import { BRAND } from "@/lib/brand";

// Shared shell for the public auth pages (login / signup): the notebook's grid
// paper and margin rule, with the brand panel beside the form on wide screens.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lk-paper relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-5 py-10 lg:flex-row lg:justify-between">
        {children}
      </div>
    </div>
  );
}

export function AuthBrand({ heading, copy }: { heading: string; copy: string }) {
  return (
    <div className="hidden max-w-sm lg:block">
      <Link href="/" className="text-3xl">
        <Wordmark />
      </Link>
      <p className="mt-3 font-reading text-lg italic text-muted-foreground">{BRAND.tagline}.</p>

      <h1 className="lk-page-title mt-9">{heading}</h1>
      <p className="mt-3 font-reading text-lg text-muted-foreground">{copy}</p>

      <ul className="mt-8 flex flex-col gap-4">
        {[
          { icon: NotebookPen, t: "Notes by subject", d: "Markdown with code, and the PDFs and links you're reading, filed together." },
          { icon: MessageSquareQuote, t: "Ask your notes", d: "A model in your browser or on your own machine answers from what you wrote." },
          { icon: Bot, t: "Your agents write here too", d: "Claude Code, Codex and Cursor save and search your notes over MCP, and you sign off on what they add." },
        ].map(({ icon: Icon, t, d }) => (
          <li key={t} className="flex items-start gap-3">
            <Icon size={17} strokeWidth={1.75} className="mt-0.5 flex-none text-[var(--lk-live)]" />
            <div>
              <div className="text-ui font-semibold">{t}</div>
              <div className="text-sm text-muted-foreground">{d}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
