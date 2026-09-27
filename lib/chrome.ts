/**
 * Routes that render without the signed-in app chrome: the spine and the
 * panels around it.
 *
 * The auth pages opt out because the chrome would be noise before sign-in.
 *
 * One list rather than a copy per component, so they can't disagree.
 */
const CHROMELESS_ROUTES = ["/login", "/signup"];

export function isChromeless(pathname: string | null | undefined): boolean {
  return CHROMELESS_ROUTES.some((p) => pathname?.startsWith(p));
}
