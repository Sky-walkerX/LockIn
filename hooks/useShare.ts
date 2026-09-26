import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import type { ShareType } from "@/app/generated/prisma";

export type ShareTarget = { type: ShareType; entityId: string };

export type ShareRecord = { token: string; createdAt: string };

const qs = ({ type, entityId }: ShareTarget) =>
  `?type=${type}&entityId=${encodeURIComponent(entityId)}`;

const key = (t: ShareTarget) => ["share", t.type, t.entityId];

/** The absolute link a viewer opens. Built client-side; the token is the secret. */
export function shareUrl(token: string) {
  return typeof window === "undefined" ? `/share/${token}` : `${window.location.origin}/share/${token}`;
}

/**
 * The live share for one record, if it has one. `enabled` keeps this from
 * firing for every row on a subject page — the popover passes false until the
 * user actually opens it.
 */
export function useShare(target: ShareTarget, enabled: boolean) {
  return useQuery({
    queryKey: key(target),
    enabled,
    queryFn: () => api.get<{ share: ShareRecord | null }>(`/api/shares${qs(target)}`),
    select: (d) => d.share,
  });
}

export function useCreateShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: ShareTarget) =>
      api.post<{ share: ShareRecord }>("/api/shares", target),
    onSuccess: (data, target) => qc.setQueryData(key(target), { share: data.share }),
  });
}

export function useRevokeShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: ShareTarget) =>
      api.del<{ success: boolean }>(`/api/shares${qs(target)}`),
    onSuccess: (_data, target) => qc.setQueryData(key(target), { share: null }),
  });
}
