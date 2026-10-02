"use client";

import { useEffect } from "react";
import { ZONE_COOKIE } from "@/lib/zone";

// Tells the server the browser's time zone (lib/zone.ts), so it can send
// Today and due revisions with the page. Written only when it changes.
export function ZoneCookie() {
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    const value = encodeURIComponent(zone);
    if (document.cookie.split("; ").includes(`${ZONE_COOKIE}=${value}`)) return;
    document.cookie = `${ZONE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  return null;
}
