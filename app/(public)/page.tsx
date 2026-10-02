import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { Landing } from "@/app/components/landing/landing";

const title = `${BRAND.name}: ${BRAND.tagline}`;

export const metadata: Metadata = {
  title: { absolute: title },
  description: BRAND.description,
  openGraph: { title, description: BRAND.description, type: "website", siteName: BRAND.name },
  twitter: { card: "summary", title, description: BRAND.description },
};

// `/` for visitors. A visit with a session cookie is rewritten to the
// notebook's contents before it gets here (next.config.ts), so this page reads
// no session and is served prerendered.
export default function LandingPage() {
  return <Landing />;
}
