import { useCallback, useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/fetcher";
import { loadSettings } from "@/lib/llm/settings";
import type { Embedder } from "@/lib/llm/embedder";
import type { SemanticHit } from "@/lib/search/semantic-hits";
import { useRagStatus } from "./useChat";

export type SemanticState =
  | { status: "checking" }
  | { status: "ready"; embedder: Embedder }
  | { status: "needs-load" } // nothing warm: loading means a model download
  | { status: "loading"; progress: number }
  | { status: "unavailable" };

// Same rule as Ask: only a WebLLM chat user's engine holds the chat weights.
const chatModel = () => {
  const s = loadSettings();
  return s.provider === "webllm" ? s.webllmModel : null;
};

/**
 * "Related by meaning" for the search palette. The query is embedded in the
 * browser, like Ask's, and scored on the server. Nothing downloads unless the
 * user asks: with no remote service and no model already loaded in this tab,
 * the state stays "needs-load" until `load()` is called.
 */
export function useSemanticSearch(q: string) {
  const [state, setState] = useState<SemanticState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    import("@/lib/llm/embedder")
      .then(({ peekEmbedder }) => peekEmbedder(chatModel()))
      .then((embedder) => {
        if (!cancelled) setState(embedder ? { status: "ready", embedder } : { status: "needs-load" });
      })
      .catch(() => !cancelled && setState({ status: "unavailable" }));
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setState({ status: "loading", progress: 0 });
    try {
      const { getEmbedder } = await import("@/lib/llm/embedder");
      const embedder = await getEmbedder(chatModel(), (r) => setState({ status: "loading", progress: r.progress }));
      setState(embedder ? { status: "ready", embedder } : { status: "unavailable" });
    } catch {
      setState({ status: "unavailable" });
    }
  }, []);

  // A longer pause than keyword search: every query costs an embedding.
  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 400);
    return () => window.clearTimeout(t);
  }, [q]);

  const embedder = state.status === "ready" ? state.embedder : null;
  const results = useQuery({
    queryKey: ["semantic-search", debounced],
    enabled: !!embedder && debounced.length >= 3,
    queryFn: async () => {
      const queryEmbedding = await embedder!.embedQuery(debounced);
      return api.post<SemanticHit[]>("/api/search/semantic", { queryEmbedding });
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

  // Only whatever Ask has indexed is searchable by meaning; say how much isn't.
  const status = useRagStatus(true);
  const unindexed = status.data ? status.data.total - status.data.indexed : 0;

  return { state, load, results, unindexed, active: debounced.length >= 3 };
}
