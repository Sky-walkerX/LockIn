"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { isChromeless } from "@/lib/chrome";

// The root layout hands the server's session to SessionProvider, so `status` is
// settled on the first render and the landing page never flashes the chrome.
export function useChromeless(): boolean {
  const pathname = usePathname();
  const { status } = useSession();
  return isChromeless(pathname, status === "authenticated");
}
