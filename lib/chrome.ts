/**
 * Routes that render without the signed-in app chrome — no nav bar, no quick
 * add, no chat rail.
 *
 * The auth pages opt out because the chrome would be noise before sign-in;
 * `/share` opts out because its viewers have no session at all, so every
 * control in the chrome would point at a page they cannot open.
 *
 * One list rather than a copy per component: the three consumers must agree, and
 * when they drifted apart a public page kept rendering a chat rail nobody
 * signed in for.
 */
const CHROMELESS_ROUTES = ["/login", "/signup", "/forgot-password", "/share"];

export function isChromeless(pathname: string | null | undefined): boolean {
  return CHROMELESS_ROUTES.some((p) => pathname?.startsWith(p));
}
