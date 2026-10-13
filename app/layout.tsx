import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { BRAND } from "@/lib/brand";
import { ZoneCookie } from "./components/zone-cookie";
import { fontVariables } from "./fonts";

export const metadata: Metadata = {
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
          {children}
        </ThemeProvider>
        <ZoneCookie />
      </body>
    </html>
  );
}
