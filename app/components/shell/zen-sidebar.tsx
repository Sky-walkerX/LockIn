"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AArrowDown, AArrowUp, BookOpen, CornerDownRight, Home, Inbox, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useCommandPalette } from "@/app/components/command/command-palette";
import { useJump } from "@/app/components/command/jump";
import { useSubjects } from "@/hooks/useSubjects";
import { useInbox } from "@/hooks/useInbox";
import { useZenWorkspace } from "@/hooks/useZenWorkspace";
import { useTextScale } from "@/hooks/useTextScale";

// The Zen workspace's sidebar: black, and only what moving between notes
// needs. The sections, to switch between; the Inbox; Go to and Search; Zen
// reading; and the way out. Everything else (Plan, Focus, Ask, settings)
// stays on the notebook's own spine, a ⇧Z away. `collapsed` keeps icons,
// with each section as its colour.
export function ZenSidebar({
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
  const { open: openPalette } = useCommandPalette();
  const jump = useJump();
  const workspace = useZenWorkspace();
  const text = useTextScale();
  const { data: subjects = [] } = useSubjects();
  const { data: inbox } = useInbox(true);

  const item = (
    key: string,
    content: { icon: React.ReactNode; label: string; trailing?: React.ReactNode },
    target: { href: string } | { onClick: () => void },
  ) => {
    const inner = (
      <>
        {content.icon}
        {!collapsed && <span className="truncate">{content.label}</span>}
        {!collapsed && content.trailing}
      </>
    );
    const title = collapsed ? content.label : undefined;
    if ("href" in target) {
      const current = target.href === "/" ? false : pathname.startsWith(target.href);
      return (
        <Link key={key} href={target.href} onClick={onNavigate} title={title} aria-current={current ? "page" : undefined} className="lk-zs-item">
          {inner}
        </Link>
      );
    }
    return (
      <button
        key={key}
        type="button"
        title={title}
        className="lk-zs-item"
        onClick={() => {
          onNavigate?.();
          target.onClick();
        }}
      >
        {inner}
      </button>
    );
  };
  const kbd = (k: string) => <kbd className="lk-zs-kbd">{k}</kbd>;

  return (
    <div className={`lk-zs ${collapsed ? "lk-zs-collapsed" : ""}`}>
      <Link href="/" onClick={onNavigate} className="lk-zs-brand" aria-label={`${BRAND.name}, home`}>
        <span aria-hidden>{collapsed ? BRAND.name.charAt(0) : BRAND.name}</span>
        {!collapsed && <span className="lk-zs-brand-tag">Zen</span>}
      </Link>

      <nav className="grid gap-px" aria-label="Move around">
        {item("goto", { icon: <CornerDownRight size={15} />, label: "Go to", trailing: kbd("/") }, { onClick: () => jump.open() })}
        {item("search", { icon: <Search size={15} />, label: "Search", trailing: kbd("⌘K") }, { onClick: openPalette })}
        {item(
          "inbox",
          {
            icon: <Inbox size={15} />,
            label: "Inbox",
            trailing: inbox && inbox.count > 0 ? <span className="lk-zs-count">{inbox.count}</span> : undefined,
          },
          { href: "/inbox" },
        )}
      </nav>

      <nav className="grid gap-px" aria-label="Sections">
        {!collapsed && <div className="lk-zs-label">Sections</div>}
        {subjects.map((s) =>
          item(
            s.id,
            {
              icon: <i className="lk-zs-chip" style={{ background: s.color || "#8b918d" }} aria-hidden />,
              label: s.title,
              trailing: <span className="lk-zs-count">{s._count.milestones}</span>,
            },
            { href: `/subjects/${s.id}` },
          ),
        )}
      </nav>

      <div className="mt-auto grid gap-px">
        <div className="lk-zs-size" role="group" aria-label="Text size">
          {!collapsed && <span>Text</span>}
          <button type="button" onClick={text.smaller} disabled={text.smallest} title="Smaller text (−)" aria-label="Smaller text">
            <AArrowDown size={15} />
          </button>
          {!collapsed && (
            <button type="button" onClick={text.reset} className="lk-zs-size-now" title="Back to normal (0)" aria-label="Text size: back to normal">
              {Math.round(text.scale * 100)}%
            </button>
          )}
          <button type="button" onClick={text.larger} disabled={text.largest} title="Larger text (=)" aria-label="Larger text">
            <AArrowUp size={15} />
          </button>
        </div>
        {item("read", { icon: <BookOpen size={15} />, label: "Read in Zen", trailing: kbd("Z") }, { onClick: jump.readInZen })}
        {item("home", { icon: <Home size={15} />, label: "Contents" }, { href: "/" })}
        {onToggleCollapsed &&
          item(
            "collapse",
            {
              icon: collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />,
              label: collapsed ? "Expand" : "Collapse",
            },
            { onClick: onToggleCollapsed },
          )}
        {item("leave", { icon: <LogOut size={15} />, label: "Leave the workspace", trailing: kbd("⇧Z") }, { onClick: workspace.toggle })}
      </div>
    </div>
  );
}
