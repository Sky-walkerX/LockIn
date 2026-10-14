import type { MetadataRoute } from "next";
import { configuredOrigin } from "@/lib/http/origin";
import { operator } from "@/lib/operator";

// Built per request: the address and whether this instance has privacy and
// terms pages are set where it runs, not when the app was built. The same
// pages robots.ts lets search engines read, minus the sign-in form.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = configuredOrigin();
  if (!origin) return [];
  const pages = [
    { path: "/", priority: 1 },
    { path: "/signup", priority: 0.6 },
    ...(operator() ? [{ path: "/privacy", priority: 0.2 }, { path: "/terms", priority: 0.2 }] : []),
  ];
  return pages.map((p) => ({ url: `${origin}${p.path}`, changeFrequency: "weekly", priority: p.priority }));
}
