import type { MetadataRoute } from "next";
import { configuredOrigin } from "@/lib/http/origin";

// Search engines get the landing page, the way in, and the privacy and terms
// pages where an instance has them. Everything else is a
// signed-in notebook, an API, or a page reached by a private link (a shared
// note, a confirmation or reset link), none of which belongs in an index.
// Built per request, so the sitemap's address is the one the instance runs at.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = configuredOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/login", "/signup", "/privacy", "/terms", "/sitemap.xml", "/media/"],
      disallow: "/",
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
