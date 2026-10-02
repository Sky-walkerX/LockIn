import { HydrationBoundary } from "@tanstack/react-query";
import { prefetch, viewerId } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-keys";
import { listConnectedApps, listTokens } from "@/lib/connections";
import { SettingsView } from "./settings-view";

// Settings, with the agent tokens and connected apps already listed.
export default async function SettingsPage() {
  const userId = await viewerId();
  const state = userId
    ? await prefetch([
        [queryKeys.tokens, () => listTokens(userId)],
        [queryKeys.connectedApps, () => listConnectedApps(userId)],
      ])
    : undefined;
  return (
    <HydrationBoundary state={state}>
      <SettingsView />
    </HydrationBoundary>
  );
}
