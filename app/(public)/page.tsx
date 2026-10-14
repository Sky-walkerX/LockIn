import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { configuredOrigin } from "@/lib/http/origin";
import { Landing } from "@/app/components/landing/landing";

const title = `${BRAND.name}: ${BRAND.tagline}`;
const origin = configuredOrigin();

// The card a shared link shows (LinkedIn, X, Discord, Slack). Versioned by
// name, since /media is cached for a week.
const image = { url: "/media/lockin-og-1.png", width: 1200, height: 630, alt: `${BRAND.name}: ${BRAND.tagline}` };

export const metadata: Metadata = {
  title: { absolute: title },
  description: BRAND.description,
  ...(origin ? { alternates: { canonical: "/" } } : {}),
  openGraph: {
    title,
    description: BRAND.description,
    type: "website",
    siteName: BRAND.name,
    ...(origin ? { url: "/", images: [image] } : {}),
  },
  twitter: {
    card: origin ? "summary_large_image" : "summary",
    title,
    description: BRAND.description,
    ...(origin ? { images: [image.url] } : {}),
  },
};

// What search engines read as the app itself: free, open-source software for
// developers, with its source and where it runs.
const structured = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: BRAND.name,
  description: BRAND.description,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web, Linux, macOS, Windows",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  license: "https://www.gnu.org/licenses/agpl-3.0.html",
  codeRepository: BRAND.repoUrl,
  sameAs: [BRAND.repoUrl],
  ...(origin ? { url: origin, image: `${origin}${image.url}` } : {}),
};

// `/` for visitors. A visit with a session cookie is rewritten to the
// notebook's contents before it gets here (next.config.ts), so this page reads
// no session and is served prerendered.
export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // A "<" in the data can't close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
      />
      <Landing />
    </>
  );
}
