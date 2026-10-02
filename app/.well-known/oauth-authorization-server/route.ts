import { authorizationServerMetadata, json, preflight } from "@/lib/oauth/http";

// Authorization Server Metadata (RFC 8414) for LockIn's own OAuth server.
export const GET = (req: Request) => json(authorizationServerMetadata(req));
export const OPTIONS = preflight;
