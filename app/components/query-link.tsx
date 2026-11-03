"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { samePage } from "@/hooks/useQueryRouter";

// A Link that, to this same page with another query, changes the address in
// the browser alone (see hooks/useQueryRouter.ts). Opening it in a new tab, or
// a link to another page, is an ordinary Link.
export function QueryLink({ href, replace, onClick, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      replace={replace}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!samePage(href, pathname)) return;
        e.preventDefault();
        if (replace) window.history.replaceState(null, "", href);
        else window.history.pushState(null, "", href);
      }}
    />
  );
}
