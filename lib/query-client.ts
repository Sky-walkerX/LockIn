import { QueryClient, isServer } from "@tanstack/react-query";

// Data stays fresh for 30s so navigation doesn't refetch the heavy subject
// detail payload; mutations invalidate explicitly, so correctness holds.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

// One client per browser tab, and a new one for every server render: a client
// kept at module level on the server would carry one user's data into the next
// user's page.
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  return (browserClient ??= makeQueryClient());
}
