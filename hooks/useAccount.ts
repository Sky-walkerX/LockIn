import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export type AccountOptions = {
  /** New accounts can be made on this instance. */
  signup: boolean;
  /** It can send email: confirmation and password-reset links. */
  mail: boolean;
};

// What the sign-in pages may offer here. They're prerendered, and these are
// settings of the running instance, so the page asks once it's in the browser.
export function useAccountOptions() {
  return useQuery({
    queryKey: ["account-options"],
    queryFn: () => api.get<AccountOptions>("/api/account/options"),
    staleTime: Infinity,
  });
}

export type Account = { email: string; name: string | null; hasPassword: boolean; createdAt: string };

export function useAccount() {
  return useQuery({ queryKey: ["account"], queryFn: () => api.get<Account>("/api/account") });
}
