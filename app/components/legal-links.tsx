"use client";

import Link from "next/link";
import { useAccountOptions } from "@/hooks/useAccount";

// Links to the privacy and terms pages, which exist only on an instance that
// names its operator (lib/operator.ts). Everywhere else this renders nothing.
// `lead` is what goes before the links when they show: a separator, a sentence.
export function LegalLinks({ lead, className }: { lead?: string; className?: string }) {
  const { data: options } = useAccountOptions();
  if (!options?.legal) return null;
  return (
    <>
      {lead}
      <Link className={className} href="/privacy">
        Privacy
      </Link>{" "}
      ·{" "}
      <Link className={className} href="/terms">
        Terms
      </Link>
    </>
  );
}
