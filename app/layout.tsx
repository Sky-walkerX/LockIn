import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, Spectral, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { BRAND } from "@/lib/brand";

// Lab Book type: Barlow for the interface, Barlow Condensed for printed labels
// and headings, Spectral for reading, JetBrains Mono for code only.
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed" });
const spectral = Spectral({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-spectral" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables live on <html>: the --lk-font-* tokens in globals.css are
    // declared on :root, and CSS custom properties substitute var() refs at
    // computed-value time on the declaring element — on <body> they'd compute
    // to invalid and the whole app silently falls back to system fonts.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${barlow.variable} ${barlowCondensed.variable} ${spectral.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
