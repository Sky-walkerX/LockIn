import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Providers } from "@/app/components/QueryProviders";
import { AppShell } from "@/app/components/shell/app-shell";

// The notebook: the spine, Ask, the palette and quick add around every page.
export default async function NotebookLayout({ children }: { children: React.ReactNode }) {
  // A JWT decode, no database. The client starts with the session settled, so
  // the frame draws once instead of waiting on /api/auth/session.
  const session = await getServerSession(authOptions);
  return (
    <Providers session={session}>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
