import type { NextConfig } from "next";

// NextAuth's session cookie: the __Secure- name over HTTPS, the plain one on a
// self-hosted copy served over HTTP.
const SESSION_COOKIES = ["__Secure-next-auth.session-token", "next-auth.session-token"];

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone for the Docker image (see
  // Dockerfile). Vercel builds its own output and ignores this.
  output: "standalone",

  // `/` is the notebook's contents for anyone signed in and the landing page
  // for everyone else. Deciding on the cookie here, before any page runs,
  // keeps the landing page static. A stale cookie reaches the contents page,
  // whose session check sends it to sign-in.
  async rewrites() {
    return {
      beforeFiles: SESSION_COOKIES.map((key) => ({
        source: "/",
        has: [{ type: "cookie" as const, key }],
        destination: "/contents",
      })),
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
