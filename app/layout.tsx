import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { BRAND } from "@/lib/brand";
import { configuredOrigin } from "@/lib/http/origin";
import { ZoneCookie } from "./components/zone-cookie";
import { MotionProvider } from "./components/motion-provider";
import { fontVariables } from "./fonts";

// Links in metadata (the preview image, the canonical address) must be full
// URLs, so they're built on the address this instance is opened at. Without
// one (a self-hosted image built with no PUBLIC_URL) the pages leave those
// links out rather than point at localhost.
const origin = configuredOrigin();

export const metadata: Metadata = {
  ...(origin ? { metadataBase: new URL(origin) } : {}),
  title: BRAND.name,
  description: BRAND.description,
};

// Reads nothing from the request, so the pages under (public) that don't
// either are prerendered. The notebook's frame is in app/(app)/layout.tsx.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html>: the --lk-font-* tokens in globals.css are
    // declared on :root, and CSS custom properties substitute var() refs at
    // computed-value time on the declaring element — on <body> they'd compute
    // to invalid and the whole app silently falls back to system fonts.
    <html lang="en" suppressHydrationWarning style={fontVariables as React.CSSProperties}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
        <ZoneCookie />
      </body>
    </html>
  );
}
