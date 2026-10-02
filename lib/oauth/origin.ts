import { headers } from "next/headers";
import { getPublicOrigin } from "mcp-handler";

/** The public origin of the current page request, worked out the way the MCP
 *  route does (forwarded headers first), so the issuer always agrees. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost";
  const proto = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https";
  return getPublicOrigin(new Request(`${proto}://${host}/`, { headers: h }));
}
