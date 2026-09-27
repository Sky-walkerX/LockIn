// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import React from "react";

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

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}