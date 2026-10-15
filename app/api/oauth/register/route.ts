import { after } from "next/server";
import { json, preflight } from "@/lib/oauth/http";
import { pruneUnusedClients, registerClient } from "@/lib/oauth/server";
import { SCOPE } from "@/lib/oauth/rules";
import { clientAddress, countAgainst } from "@/lib/limits/rate";

/**
 * POST /api/oauth/register: Dynamic Client Registration (RFC 7591). Kept for
 * clients that don't use a Client ID Metadata Document; the MCP spec now
 * prefers those. Public clients only: there's no secret to hand out.
 */
export async function POST(req: Request) {
  // Registration is open to anyone by design, and each one is a row.
  const limit = await countAgainst(`oauth-register:${clientAddress(req.headers)}`, 30, 60 * 60);
  if (!limit.ok) {
    return json({ error: "too_many_requests", error_description: "Too many registrations from here" }, 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  const body = await req.json().catch(() => null);
  const result = await registerClient(body);
  if (!result.ok) return json({ error: "invalid_client_metadata", error_description: result.error }, 400);
  const { client } = result;
  // Registration is open, so registrations nobody signed in with are cleared
  // out as new ones arrive: the table can't grow without bound.
  after(() => pruneUnusedClients().catch((e) => console.error("Pruning unused OAuth clients failed", e)));
  return json(
    {
      client_id: client.id,
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: SCOPE,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    201,
  );
}

export const OPTIONS = preflight;
