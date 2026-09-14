import Link from "next/link";

// Rendered for a token that resolves to nothing — revoked, mistyped, or
// pointing at a deleted record. Deliberately says no more than that: which of
// the three it was is not a viewer's business.
export default function ShareNotFound() {
  return (
    <main className="w-full px-4 py-20 text-center">
      <p className="lk-display text-lg font-bold">This link isn&apos;t available</p>
      <p className="mt-1 text-sm text-muted-foreground">
        It may have been revoked, or the item was deleted.
      </p>
      <Link href="/" className="lk-btn mt-5 inline-block px-3 py-2 text-[10.5px]">
        Go to LockIn
      </Link>
    </main>
  );
}
