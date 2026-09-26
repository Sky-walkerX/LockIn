import { BRAND } from "@/lib/brand";

// The only place the name is drawn. "label" is the notebook's cover label (a
// paper plate with the name in printed caps), for the spine and auth pages;
// "plain" is the bare name for tight spots like share-page headers.
export function Wordmark({ variant = "label", className = "" }: { variant?: "label" | "plain"; className?: string }) {
  return (
    <span className={`lk-wordmark ${variant === "label" ? "lk-wordmark-label" : ""} ${className}`}>{BRAND.name}</span>
  );
}
