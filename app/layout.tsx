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
    <html lang="en" suppressHydrationWarning>
      <body className={`${archivo.variable} ${hanken.variable} ${inter.variable} ${spaceMono.variable} ${jetbrains.variable} antialiased`}>
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
