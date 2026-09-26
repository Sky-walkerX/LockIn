import type { PoolConfig } from "pg";

/**
 * Turns DATABASE_URL into settings for the pg driver, which Prisma 7 connects
 * through. Two things differ from Prisma 6's own engine and are kept the same
 * here on purpose:
 *
 * - Prisma-only URL parameters (pgbouncer, connection_limit, pool_timeout,
 *   schema) mean nothing to pg, so they're taken out; connection_limit still
 *   sizes the pool, and a slow connection still gives up after 5 seconds.
 * - SSL. Prisma 6 encrypted without checking the certificate, as libpq's
 *   sslmode=require does, while pg either skips SSL or verifies strictly.
 *   An explicit sslmode keeps its libpq meaning; with none, Supabase hosts
 *   (which present Supabase's own CA) are encrypted as before, and anything
 *   else, like the self-hosted Postgres container, connects as it did.
 */
const PRISMA_ONLY = ["pgbouncer", "connection_limit", "pool_timeout", "schema", "sslmode", "sslaccept", "statement_cache_size"];

export function poolConfig(databaseUrl: string): PoolConfig {
  // No URL at all (a build with no database): nothing connects until a query
  // runs, and that fails with pg's own error rather than at import.
  if (!databaseUrl) return { connectionTimeoutMillis: 5_000 };
  const url = new URL(databaseUrl);
  const sslmode = url.searchParams.get("sslmode");
  const limit = Number(url.searchParams.get("connection_limit"));
  for (const key of PRISMA_ONLY) url.searchParams.delete(key);

  let ssl: PoolConfig["ssl"];
  if (sslmode === "verify-full" || sslmode === "verify-ca") ssl = { rejectUnauthorized: true };
  else if (sslmode === "require") ssl = { rejectUnauthorized: false };
  else if (sslmode === "disable") ssl = false;
  else ssl = /(^|\.)supabase\.(com|co)$/.test(url.hostname) ? { rejectUnauthorized: false } : false;

  return {
    connectionString: url.toString(),
    ssl,
    connectionTimeoutMillis: 5_000,
    ...(Number.isInteger(limit) && limit > 0 ? { max: limit } : {}),
  };
}
