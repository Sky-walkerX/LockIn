import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "./components/brand/wordmark";

// The notebook's cover, until it has pages.
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <main className="lk-paper grid min-h-screen place-items-center p-8">
      <div className="text-center">
        <Wordmark className="text-3xl" />
        <p className="mt-3 font-reading text-lg text-muted-foreground">{BRAND.tagline}.</p>
        <p className="mt-6 text-sm text-muted-foreground">Signed in as {session.user?.email}.</p>
      </div>
    </main>
  );
}
