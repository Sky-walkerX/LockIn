import { CORS, preflight } from "@/lib/oauth/http";
import { revokeToken } from "@/lib/oauth/server";

// POST /api/oauth/revoke: token revocation (RFC 7009). Always 200, so it can't
// be used to test whether a token exists.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  if (typeof token === "string" && token) await revokeToken(token);
  return new Response(null, { status: 200, headers: CORS });
}

export const OPTIONS = preflight;
