import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <h1 className="text-3xl font-bold">{BRAND.name}</h1>
        <p className="mt-3 text-lg text-neutral-600">{BRAND.tagline}.</p>
      </div>
    </main>
  );
}
