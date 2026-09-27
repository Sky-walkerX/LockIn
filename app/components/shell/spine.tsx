"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/useMounted";
import {
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  SunMoon,
} from "lucide-react";
import { Wordmark } from "@/app/components/brand/wordmark";
import { BRAND } from "@/lib/brand";
import { NewSubject } from "@/app/components/home/new-subject";
import { useSubjects } from "@/hooks/useSubjects";
import { AccountMenu } from "./account-menu";

// The notebook's spine: cover label, the book's own pages, its sections (one per
// subject, as coloured tabs) and the account. Rendered docked on
// wide screens and inside a sheet on phones; `collapsed` keeps icons only.
export function Spine({
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Called after any navigation, so the phone sheet can close itself. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();
  const signedIn = !!session?.user;

  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const { data: subjects = [] } = useSubjects();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const owner = session?.user?.name || session?.user?.email?.split("@")[0];

  const link = (href: string, icon: React.ReactNode, label: string, trailing?: React.ReactNode) => (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive(href) ? "page" : undefined}
      title={collapsed ? label : undefined}
      className="lk-spine-item"
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && trailing}
    </Link>
  );

  const action = (onClick: () => void, icon: React.ReactNode, label: string, kbd?: string) => (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        onClick();
      }}
      title={collapsed ? `${label}${kbd ? ` (${kbd})` : ""}` : undefined}
      className="lk-spine-item"
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && kbd && <kbd className="lk-spine-kbd">{kbd}</kbd>}
    </button>
  );

  return (
    <div className={`flex h-full flex-col gap-5 overflow-y-auto overflow-x-hidden ${collapsed ? "px-2 py-4" : "px-3.5 py-5"}`}>
      {/* Cover label */}
      <Link href="/" onClick={onNavigate} className={`lk-cover-label ${collapsed ? "lk-cover-label-sm" : ""}`} aria-label="Home">
        {collapsed ? (
          <span className="lk-wordmark text-lg" aria-hidden>
            {BRAND.name.charAt(0)}
          </span>
        ) : (
          <>
            <span className="lk-cover-kicker">Notebook</span>
            <Wordmark variant="plain" className="text-2xl" />
            {owner && (
              <span className="lk-cover-line">
                <span>Owner</span>
                <i>{owner}</i>
              </span>
            )}
          </>
        )}
      </Link>

      {signedIn && (
        <>
          <nav className="grid gap-px" aria-label="Notebook">
            {link("/", <Home size={16} strokeWidth={1.75} />, "Home")}
          </nav>

          <nav className="grid gap-px" aria-label="Sections">
            {!collapsed && (
              <div className="lk-spine-label flex items-center justify-between">
                Sections
                <NewSubject
                  align="start"
                  trigger={
                    <button type="button" className="lk-spine-mini" aria-label="New subject" title="New subject">
                      <Plus size={14} />
                    </button>
                  }
                />
              </div>
            )}
            {subjects.map((s) => {
              const href = `/subjects/${s.id}`;
              return (
                <Link
                  key={s.id}
                  href={href}
                  onClick={onNavigate}
                  aria-current={isActive(href) ? "page" : undefined}
                  title={collapsed ? s.title : undefined}
                  className="lk-spine-item"
                >
                  <i className="lk-tab-chip" style={{ background: s.color || "var(--lk-cloth-ink-2)" }} aria-hidden />
                  {!collapsed && <span className="truncate">{s.title}</span>}
                  {!collapsed && <span className="lk-spine-count">{s._count.milestones}</span>}
                </Link>
              );
            })}
            {!collapsed && subjects.length === 0 && (
              <p className="px-2 text-sm leading-snug text-[var(--lk-cloth-ink-2)]">
                Add a subject to start a section.
              </p>
            )}
          </nav>

        </>
      )}

      <div className="mt-auto grid gap-px">
        {mounted &&
          action(
            () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
            <SunMoon size={16} strokeWidth={1.75} />,
            resolvedTheme === "dark" ? "Light paper" : "Dark paper",
          )}
        {onToggleCollapsed &&
          action(
            onToggleCollapsed,
            collapsed ? <PanelLeftOpen size={16} strokeWidth={1.75} /> : <PanelLeftClose size={16} strokeWidth={1.75} />,
            collapsed ? "Expand" : "Collapse",
          )}
        {signedIn && <AccountMenu collapsed={collapsed} />}
      </div>
    </div>
  );
}
