import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";

export type AgentToken = {
  id: string;
  name: string;
  preview: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const KEY = ["tokens"] as const;

export function useTokens() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<AgentToken[]>("/api/tokens") });
}

// The response is the only time the secret exists outside the agent's config.
export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<AgentToken & { secret: string }>("/api/tokens", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRevokeToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/tokens/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** An app that connected by signing in (OAuth) rather than with a token. */
export type ConnectedApp = { id: string; name: string; createdAt: string; lastUsedAt: string | null };

const APPS_KEY = ["oauth-grants"] as const;

export function useConnectedApps() {
  return useQuery({ queryKey: APPS_KEY, queryFn: () => api.get<ConnectedApp[]>("/api/oauth/grants") });
}

export function useDisconnectApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ success: boolean }>(`/api/oauth/grants/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPS_KEY }),
  });
}
