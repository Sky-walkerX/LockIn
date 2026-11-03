"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useEffectEvent, useState } from "react";
import { useStoredValue } from "@/hooks/useStoredValue";
import { Menu, Search, SquarePen } from "lucide-react";
import { useChromeless } from "@/hooks/useChromeless";
import { Wordmark } from "@/app/components/brand/wordmark";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { useCommandPalette } from "@/app/components/command/command-palette";
import { Spine } from "./spine";
import { ZenSidebar } from "./zen-sidebar";
import { useZenWorkspace } from "@/hooks/useZenWorkspace";
import { useTextScale } from "@/hooks/useTextScale";
import { WORKSPACE_CLASS } from "@/lib/zen-workspace";

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

const COLLAPSE_KEY = "lockin.sidebar";

// The signed-in frame: the cloth spine on the left, grid paper to its right
// (Ask floats over it). Below `md` the spine moves into a sheet behind a bar.
// In the Zen workspace (hooks/useZenWorkspace.ts) a black sidebar stands in
// for the spine. Both are in the page and the class on <html> picks one, so a
// reload in the workspace shows the right one from its first paint.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const chromeless = useChromeless();
  const { open: openPalette } = useCommandPalette();
  const router = useRouter();
  // Remembered per browser. The server renders it open; the client switches
  // to the stored state after hydration (useStoredValue).
  const [stored, setStored] = useStoredValue(COLLAPSE_KEY, "open");
  const collapsed = stored === "collapsed";
  const toggleCollapsed = () => setStored(collapsed ? "open" : "collapsed");

  // A navigation from inside the sheet should land on the new page, not on a
  // sheet still covering it: close it when the path changes, during render.
  const workspace = useZenWorkspace();
  const { active: zen, toggle: toggleWorkspace } = workspace;
  useEffect(() => {
    document.documentElement.classList.toggle(WORKSPACE_CLASS, zen);
  }, [zen]);
  const text = useTextScale();
  useEffect(() => {
    document.documentElement.style.setProperty("--lk-text-scale", String(text.scale));
  }, [text.scale]);
  const sizeText = useEffectEvent((key: string) => {
    const size = { "-": text.smaller, "=": text.larger, "+": text.larger, "0": text.reset }[key];
    size?.();
    return !!size;
  });
  // ⇧Z: into the workspace and out. − = and 0 size the text where it reads
  // large: in the workspace and in Zen. Neither while typing, or while a
  // dialog other than Zen has the floor.
  useEffect(() => {
    if (chromeless) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || typing(e.target)) return;
      const modal = document.querySelector('[aria-modal="true"]');
      const reading = !!modal?.classList.contains("lk-zen");
      if (modal && !reading) return;
      if (e.key === "Z" && e.shiftKey && !reading) {
        e.preventDefault();
        void toggleWorkspace();
        return;
      }
      if ((reading || zen) && sizeText(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chromeless, toggleWorkspace, zen]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPath, setSheetPath] = useState(pathname);
  if (sheetPath !== pathname) {
    setSheetPath(pathname);
    setSheetOpen(false);
  }

  if (chromeless) return <>{children}</>;

  return (
    <div className="flex min-h-screen min-w-0 flex-1">
      <aside
        className={`lk-cloth lk-spine-aside sticky top-0 hidden h-screen flex-none transition-[width] duration-200 ease-out md:block ${
          collapsed ? "w-[60px]" : "w-[236px]"
        }`}
        aria-label="Notebook spine"
      >
        <Spine collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>
      <aside
        className={`lk-zs-aside sticky top-0 hidden h-screen flex-none transition-[width] duration-200 ease-out ${
          collapsed ? "w-[60px]" : "w-[224px]"
        }`}
        aria-label="Sections"
      >
        <ZenSidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <header className="lk-cloth lk-mobilebar sticky top-0 z-40 flex items-center gap-2 px-3 py-2.5 md:hidden">
            <SheetTrigger className="lk-spine-mini h-8 w-8" aria-label="Open the notebook spine">
              <Menu size={18} />
            </SheetTrigger>
            <Link href="/" aria-label={`${BRAND.name}, home`}>
              <Wordmark className="text-ui" />
            </Link>
            {session?.user && (
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={openPalette} className="lk-spine-mini h-8 w-8" aria-label="Search">
                  <Search size={17} />
                </button>
                <button type="button" onClick={() => router.push("/inbox?new=1")} className="lk-spine-mini h-8 w-8" aria-label="New note">
                  <SquarePen size={17} />
                </button>
              </div>
            )}
          </header>
          <SheetContent label="Notebook" className={zen ? "lk-zs-sheet" : "lk-cloth"}>
            {zen ? <ZenSidebar onNavigate={() => setSheetOpen(false)} /> : <Spine onNavigate={() => setSheetOpen(false)} />}
          </SheetContent>
        </Sheet>

        <div className="lk-paper flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
