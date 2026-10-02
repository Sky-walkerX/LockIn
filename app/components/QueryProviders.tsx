"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import React from "react";
import { QuickAddProvider } from "./quick-add";
import { CommandPaletteProvider } from "./command/command-palette";
import { ChatProvider } from "./chat/chat-provider";
import { FocusProvider } from "./focus/focus-provider";
import { QueryProvider } from "./query-provider";

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <QueryProvider>
      <SessionProvider session={session}>
        {/* The palette sits innermost: its actions open the others. */}
        <QuickAddProvider>
          <FocusProvider>
            <ChatProvider>
              <CommandPaletteProvider>{children}</CommandPaletteProvider>
            </ChatProvider>
          </FocusProvider>
        </QuickAddProvider>
      </SessionProvider>
    </QueryProvider>
  );
}