"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useStoredValue } from "@/hooks/useStoredValue";
import { Menu, Search } from "lucide-react";
import { useChromeless } from "@/hooks/useChromeless";
import { Wordmark } from "@/app/components/brand/wordmark";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";
import { useCommandPalette } from "@/app/components/command/command-palette";
import { Spine } from "./spine";

const COLLAPSE_KEY = "lockin.sidebar";

// The signed-in frame: the cloth spine on the left, grid paper to its right.
// Below `md` the spine moves into a sheet behind a bar.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const chromeless = useChromeless();
  const { open: openPalette } = useCommandPalette();
  // Remembered per browser. The server renders it open; the client switches
  // to the stored state after hydration (useStoredValue).
  const [stored, setStored] = useStoredValue(COLLAPSE_KEY, "open");
  const collapsed = stored === "collapsed";
  const toggleCollapsed = () => setStored(collapsed ? "open" : "collapsed");

  // A navigation from inside the sheet should land on the new page, not on a
  // sheet still covering it: close it when the path changes, during render.
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
        className={`lk-cloth sticky top-0 hidden h-screen flex-none transition-[width] duration-200 ease-out md:block ${
          collapsed ? "w-[60px]" : "w-[236px]"
        }`}
        aria-label="Notebook spine"
      >
        <Spine collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <header className="lk-cloth sticky top-0 z-40 flex items-center gap-2 px-3 py-2.5 md:hidden">
            <SheetTrigger className="lk-spine-mini h-8 w-8" aria-label="Open the notebook spine">
              <Menu size={18} />
            </SheetTrigger>
            <Link href="/" aria-label="Home">
              <Wordmark className="text-ui" />
            </Link>
            {session?.user && (
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={openPalette} className="lk-spine-mini h-8 w-8" aria-label="Search">
                  <Search size={17} />
                </button>
              </div>
            )}
          </header>
          <SheetContent label="Notebook" className="lk-cloth">
            <Spine onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="lk-paper flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
