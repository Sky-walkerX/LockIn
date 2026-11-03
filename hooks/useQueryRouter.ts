"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

// Moving within a page by its query (?note=, ?tab=, ?zen=, ?read=) needs
// nothing from the server: the notebook's pages draw from data the browser
// already holds, and no server page reads its search params. A Next
// navigation would still render the page on the server again and send the
// whole subject, every note's text, along with it before the note showed. So
// those go through the History API, which Next mirrors into useSearchParams;
// anything that leaves the page navigates as usual.

/** Whether `href` is this page with another query. */
export function samePage(href: string, pathname = window.location.pathname): boolean {
  const url = new URL(href, window.location.href);
  return url.origin === window.location.origin && url.pathname === pathname;
}

type Router = ReturnType<typeof useRouter>;

/** useRouter, with push and replace staying in the browser when only the query changes. */
export function useQueryRouter(): Router {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => (samePage(href) ? window.history.pushState(null, "", href) : router.push(href, options)),
      replace: (href, options) =>
        samePage(href) ? window.history.replaceState(null, "", href) : router.replace(href, options),
    }),
    [router],
  );
}
