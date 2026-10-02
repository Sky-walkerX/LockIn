import { QueryProvider } from "@/app/components/query-provider";

// Pages anyone can open: the landing page, sign-in and sign-up, shared pages
// and the consent screen for apps. Nothing here reads the session for the
// whole group, so the pages that don't read it themselves are prerendered.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
