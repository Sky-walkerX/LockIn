"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Code2, LogOut, Settings } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useAccount } from "@/hooks/useAccount";
import { Avatar } from "@/app/components/account/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export function AccountMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { data: session } = useSession();
  const { data: account } = useAccount();
  const user = session?.user;
  if (!user) return null;
  const name = user.name || user.email || "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="lk-spine-item" title={collapsed ? name : undefined}>
        <Avatar name={name} image={account?.image} />
        {!collapsed && <span className="truncate">{name}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-semibold">{user.name || "Account"}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings size={14} /> Settings
          </Link>
        </DropdownMenuItem>
        {/* AGPL-3.0: whoever uses a running copy can get its source. */}
        <DropdownMenuItem asChild>
          <a href={BRAND.repoUrl} target="_blank" rel="noopener noreferrer">
            <Code2 size={14} /> Source code
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
          <LogOut size={14} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
