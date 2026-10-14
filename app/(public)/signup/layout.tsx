import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

// The page itself runs in the browser; its title is set here.
export const metadata: Metadata = { title: `Create your notebook · ${BRAND.name}` };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
