import type { MetadataRoute } from "next";

// Search engines get the landing page, the way in, and the privacy and terms
// pages where an instance has them. Everything else is a
// signed-in notebook, an API, or a page reached by a private link (a shared
// note, a confirmation or reset link), none of which belongs in an index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/$", "/login", "/signup", "/privacy", "/terms"], disallow: "/" },
  };
}
