/**
 * The origin visitors reach this app at, for URLs handed back to them (stored
 * file links, upload targets). Behind a proxy (Vercel, a self-hosted reverse
 * proxy) the request's own URL can be internal, so forwarded headers win.
 */
export function publicOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const url = new URL(request.url);
  if (!host) return url.origin;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? url.protocol.replace(":", "");
  return `${proto}://${host.split(",")[0].trim()}`;
}
