"use client";

import { usePathname } from "next/navigation";
import { isChromeless } from "@/lib/chrome";

// Whether the current page renders without the signed-in app chrome.
export function useChromeless(): boolean {
  return isChromeless(usePathname());
}
