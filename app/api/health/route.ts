import prisma from "@/lib/prisma";

// GET /api/health - whether this server can answer and reach its database.
// For the container healthcheck and uptime monitors; no session, and it says
// nothing beyond up or down.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
