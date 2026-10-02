import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { BRAND } from "@/lib/brand";
import { NotebookHome } from "./components/home/notebook-home";
import { Landing } from "./components/landing/landing";

// `/` is two pages: the landing page for visitors and the notebook's contents
// for anyone signed in. The session is a JWT decode, so deciding costs nothing.
export async function generateMetadata(): Promise<Metadata> {
  if (await getServerSession(authOptions)) return { title: BRAND.name };
  const title = `${BRAND.name}: ${BRAND.tagline}`;
  return {
    title: { absolute: title },
    description: BRAND.description,
    openGraph: { title, description: BRAND.description, type: "website", siteName: BRAND.name },
    twitter: { card: "summary", title, description: BRAND.description },
  };
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return session ? <NotebookHome /> : <Landing />;
}
