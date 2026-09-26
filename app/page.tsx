import { BRAND } from "@/lib/brand";
import { Wordmark } from "./components/brand/wordmark";

// The notebook's cover, until it has pages.
export default function HomePage() {
  return (
    <main className="lk-paper grid min-h-screen place-items-center p-8">
      <div className="text-center">
        <Wordmark className="text-3xl" />
        <p className="mt-3 font-reading text-lg text-muted-foreground">{BRAND.tagline}.</p>
      </div>
    </main>
  );
}
