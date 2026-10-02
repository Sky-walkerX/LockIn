import { getPublicOrigin } from "mcp-handler";
import { SCOPE } from "./rules";
import { issuerFor, resourceFor } from "./server";

// The discovery, registration and token endpoints answer any origin: some MCP
// clients run in a browser, and none of these use cookies.
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
};

export const preflight = () => new Response(null, { status: 204, headers: CORS });

export const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store", ...headers } });

/** RFC 9728: where the MCP server's tokens come from, and what they're for. */
export function protectedResourceMetadata(req: Request) {
  const origin = getPublicOrigin(req);
  return {
    resource: resourceFor(origin),
    authorization_servers: [issuerFor(origin)],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "LockIn",
  };
}

/** RFC 8414: how to sign in. CIMD needs both `client_id_metadata_document_supported`
 *  and the "none" auth method, or Claude falls back to registering. */
export function authorizationServerMetadata(req: Request) {
  const origin = getPublicOrigin(req);
  return {
    issuer: issuerFor(origin),
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    revocation_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE, "offline_access"],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
  };
}
