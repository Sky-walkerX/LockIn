import type { NextConfig } from "next";

// NextAuth's session cookie: the __Secure- name over HTTPS, the plain one on a
// self-hosted copy served over HTTP.
const SESSION_COOKIES = ["__Secure-next-auth.session-token", "next-auth.session-token"];

// What a page may load and where it may send people. It can't be the strict
// kind that stamps each inline script, since that needs every page rendered
// per request and the landing page is prerendered; so inline scripts are
// allowed, and the rest is closed:
//  - scripts come from LockIn itself and nowhere else. WebAssembly may be
//    compiled, for the in-browser embedding and chat models. React's dev
//    tooling needs eval; a build doesn't.
//  - connections aren't restricted: Ask talks to whichever model endpoint the
//    user configured, and the models download from Hugging Face.
//  - images and framed PDFs come from anywhere over https (a note can show any
//    image; uploads may live in Supabase Storage), frames never from http.
//  - no plugins, no <base> pointing elsewhere, no form posting elsewhere, and
//    only LockIn frames LockIn.
// No upgrade-insecure-requests: a self-hosted copy may be served over http.
const dev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = ({ formsStayHere }: { formsStayHere: boolean }) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src * data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob:",
    "connect-src * data: blob:",
    "worker-src 'self' blob:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    ...(formsStayHere ? ["form-action 'self'"] : []),
    "frame-ancestors 'self'",
  ].join("; ");

// Sent with every response. HSTS isn't here: it belongs to whatever serves
// HTTPS (the proxy in front of a self-hosted copy), since a copy served over
// plain HTTP must never promise it.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy({ formsStayHere: true }) },
  // A file is what its Content-Type says, never what its bytes look like.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only LockIn's own pages may frame LockIn (the reader frames a stored PDF),
  // so "Allow" on the page that connects an app can't be clicked through
  // someone else's page. The policy's frame-ancestors says the same; this is
  // for browsers that predate it.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Other sites learn the origin a visitor came from, never the path: share,
  // confirmation and reset links carry their secret in the address.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // A self-contained server in .next/standalone for the Docker image (see
  // Dockerfile). Vercel builds its own output and ignores this.
  output: "standalone",

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // The CPU embedder's runtime (scripts/copy-ort.mjs): 14 MB that never
      // changes under an address that carries its version.
      {
        source: "/ort/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // The landing film and its poster (public/media). A week, and a day
      // more of serving the old copy while a new one is fetched: a recut
      // film keeps its name, so it can't be cached for good.
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      // "Allow" on this page is a form whose answer sends the browser on to
      // the app that asked, at an address checked against the ones that app
      // registered. Chrome counts that redirect as the form's destination,
      // so this one page's policy doesn't pin forms to LockIn. (A later rule
      // replaces an earlier one's header of the same name.)
      {
        source: "/oauth/authorize",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy({ formsStayHere: false }) }],
      },
    ];
  },

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
