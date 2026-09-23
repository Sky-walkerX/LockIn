/**
 * Build a `"col" = $1, "col2" = $2` SET clause plus its ordered values,
 * skipping undefined entries. Returns null when there is nothing to set.
 *
 * Used by the update routes, which fold their ownership check into the
 * statement's WHERE and return the new row with RETURNING — one round trip
 * instead of a read-then-write pair. (Prisma's `updateManyAndReturn` emits the
 * same SQL but wraps it in BEGIN/COMMIT, costing three.)
 *
 * Deliberately plain strings rather than `Prisma.sql` fragments: under Turbopack
 * the generated client can be loaded as two module instances, so a fragment
 * built in this file fails the `instanceof Sql` check inside a `$queryRaw`
 * template in a route and gets bound as a parameter (`SET $1`) instead of
 * inlined. Numbered placeholders sidestep that entirely.
 *
 * Column names are interpolated as identifiers, so callers must pass keys from
 * a validated allowlist — every caller spreads a parsed Zod object. Values are
 * always parameterised, never interpolated.
 *
 * `casts` names the Postgres type to cast a column's placeholder to, e.g.
 * `{ priority: "Priority" }` for `"priority" = $1::"Priority"`. Enum columns
 * need this: the driver binds every JS string as `text`, and Postgres refuses
 * an implicit `text` -> enum conversion in an UPDATE (error 42804), so an
 * uncast enum write fails outright. Type names are interpolated as identifiers
 * too, and sanitised the same way.
 *
 * Date values are pinned to UTC. Every DateTime column is `timestamp without
 * time zone` holding UTC, but a bound JS Date arrives as timestamptz, and
 * assigning that to a plain timestamp converts it into the session's time
 * zone — harmless on a UTC database, hours off on any other.
 */
export function setClause(
  data: Record<string, unknown>,
  casts?: Record<string, string>,
  startIndex = 1,
): { clause: string; values: unknown[] } | null {
  const cols = Object.keys(data).filter((k) => data[k] !== undefined);
  if (cols.length === 0) return null;
  const ident = (s: string) => s.replace(/[^A-Za-z0-9_]/g, "");
  return {
    clause: cols
      .map((c, i) => {
        const n = startIndex + i;
        if (data[c] instanceof Date) return `"${ident(c)}" = ($${n}::timestamptz AT TIME ZONE 'UTC')`;
        const cast = casts?.[c];
        return `"${ident(c)}" = $${n}${cast ? `::"${ident(cast)}"` : ""}`;
      })
      .join(", "),
    values: cols.map((c) => data[c]),
  };
}
