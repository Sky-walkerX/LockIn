/**
 * Where to go after signing in, from a `?next=` value: a path on this site, or
 * home. Anything that could leave the site ("//evil.com", "https://…",
 * "/\evil.com") is ignored, so the parameter can't become an open redirect.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
