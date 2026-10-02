import { json, preflight, protectedResourceMetadata } from "@/lib/oauth/http";

// Protected Resource Metadata for /api/mcp (RFC 9728). Served at both the root
// and the path-suffixed location clients probe.
export const GET = (req: Request) => json(protectedResourceMetadata(req));
export const OPTIONS = preflight;
