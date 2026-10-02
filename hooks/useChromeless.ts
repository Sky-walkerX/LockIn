"use client";

import { useSession } from "next-auth/react";

// The notebook's frame (spine, Ask, quick add) only makes sense signed in. Its
// layout hands the server's session to SessionProvider, so `status` is settled
// on the first render. Signed out here means a stale cookie on its way to
// sign-in: the page renders bare until the redirect.
export function useChromeless(): boolean {
  return useSession().status !== "authenticated";
}
