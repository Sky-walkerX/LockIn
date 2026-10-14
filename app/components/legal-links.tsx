"use client";

import Link from "next/link";
import { useAccountOptions } from "@/hooks/useAccount";

// Links to the privacy and terms pages, which exist only on an instance that
// names its operator (lib/operator.ts). Everywhere else this renders nothing.
export function LegalLinks({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  const { data: options } = useAccountOptions();
  if (!options?.legal) return null;
  return (
    <span className={className}>
      <Link className={linkClassName} href="/privacy">
        Privacy
      </Link>
      <Link className={linkClassName} href="/terms">
        Terms
      </Link>
    </span>
  );
}
