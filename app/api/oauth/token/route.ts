import { after } from "next/server";
import { getPublicOrigin } from "mcp-handler";
import { json, preflight } from "@/lib/oauth/http";
import { exchangeCode, refreshTokens, resourceFor, sweepExpired } from "@/lib/oauth/server";
import { clientAddress, countAgainst } from "@/lib/limits/rate";

/**
 * POST /api/oauth/token: the authorization_code and refresh_token grants, as
 * application/x-www-form-urlencoded (RFC 6749 §4.1.3). Errors are RFC 6749
 * codes, `invalid_grant` for any token that's no good, which is what tells a
 * client to sign in again.
 */
export async function POST(req: Request) {
  const limit = await countAgainst(`oauth-token:${clientAddress(req.headers)}`, 120, 60);
  if (!limit.ok) {
    return json({ error: "slow_down", error_description: "Too many token requests from here" }, 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }
  // Codes and tokens that have expired are cleared out about once an hour,
  // after the reply, by whichever request finds the hour is up.
  after(async () => {
    if ((await countAgainst("oauth-sweep", 1, 60 * 60)).ok) await sweepExpired();
  });

  const form = await req.formData().catch(() => null);
  const get = (k: string) => {
    const v = form?.get(k);
    return typeof v === "string" && v ? v : null;
  };
  const grantType = get("grant_type");
  const clientId = get("client_id");
  if (!clientId) return json({ error: "invalid_client", error_description: "client_id is required" }, 401);

  // A token for this server only (RFC 8707): a resource naming anything else is refused.
  const resource = get("resource");
  if (resource && resource.replace(/\/$/, "") !== resourceFor(getPublicOrigin(req))) {
    return json({ error: "invalid_target", error_description: "This server only issues tokens for its MCP endpoint" }, 400);
  }

  if (grantType === "authorization_code") {
    const code = get("code");
    const redirectUri = get("redirect_uri");
    const codeVerifier = get("code_verifier");
    if (!code || !redirectUri || !codeVerifier) {
      return json({ error: "invalid_request", error_description: "code, redirect_uri and code_verifier are required" }, 400);
    }
    const result = await exchangeCode({ code, clientId, redirectUri, codeVerifier, resource });
    return "error" in result ? json(result, 400) : json(result);
  }

  if (grantType === "refresh_token") {
    const refreshToken = get("refresh_token");
    if (!refreshToken) return json({ error: "invalid_request", error_description: "refresh_token is required" }, 400);
    const result = await refreshTokens(refreshToken, clientId);
    return "error" in result ? json(result, 400) : json(result);
  }

  return json({ error: "unsupported_grant_type", error_description: "Use authorization_code or refresh_token" }, 400);
}

export const OPTIONS = preflight;
