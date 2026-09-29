const MAX_TERMS = 5;

/**
 * Split a search box value into lowercase terms. A row has to contain every
 * term (the route matches with ILIKE ALL), so one-letter terms are dropped:
 * "a" or "i" appears in nearly every note and would only add noise.
 */
export function parseTerms(q: string): string[] {
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  return [...new Set(terms)].slice(0, MAX_TERMS);
}

/** `%term%` patterns for ILIKE, with `\`, `%` and `_` escaped so they match literally. */
export function likePatterns(terms: string[]): string[] {
  return terms.map((t) => `%${t.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
}
