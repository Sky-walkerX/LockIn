// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { QuickAddProvider } from "./quick-add";
import { CommandPaletteProvider } from "./command/command-palette";
import { ChatProvider } from "./chat/chat-provider";
import { FocusProvider } from "./focus/focus-provider";

// Data stays fresh for 30s so navigation doesn't refetch the heavy subject
// detail payload; mutations invalidate explicitly, so correctness holds.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {/* The palette sits innermost: its actions open the others. */}
        <QuickAddProvider>
          <FocusProvider>
            <ChatProvider>
              <CommandPaletteProvider>{children}</CommandPaletteProvider>
            </ChatProvider>
          </FocusProvider>
        </QuickAddProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}