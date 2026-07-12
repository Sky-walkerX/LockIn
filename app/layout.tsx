import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk, Inter, Space_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/QueryProviders";
import { ThemeProvider } from "next-themes";
import Navbar from "./components/Navbar";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "LockIn",
  description: "Your subjects, plans, and resources — one place to lock in.",
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
      className={`${archivo.variable} ${hanken.variable} ${inter.variable} ${spaceMono.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Providers>
            <Navbar />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
