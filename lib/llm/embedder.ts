"use client";

/**
 * Picks whichever embedding backend this browser can actually run.
 *
 * Callers ask for an embedder and get one; which runtime answers is not their
 * problem. All three produce vectors tagged `EMBEDDING_MODEL`, so the server
 * never needs to know which one ran.
 *
 * Remote first, when LockIn's optional ingest service is configured: no
 * download, no WebGPU requirement, and it's faster than either in-browser
 * path. WebGPU next — roughly an order of magnitude faster than the CPU
 * fallback, and on the WebLLM chat path the weights are already resident in
 * an engine that exists anyway. CPU last, which is every browser but is,
 * per `wasm-embedder.ts`, "slower by an order of magnitude".
 */

export type EmbedderBackend = "remote" | "webgpu" | "wasm";

export type EmbedProgress = { progress: number; text?: string };

export type Embedder = {
  backend: EmbedderBackend;
  embedQuery(text: string): Promise<number[]>;
  embedPassages(texts: string[]): Promise<number[][]>;
};

/**
 * `chatModel` is the WebLLM chat model when chat runs in-browser, and null
 * otherwise — it only decides whether the WebGPU engine also has to hold chat
 * weights, and is ignored entirely on the CPU path.
 */
export async function getEmbedder(
  chatModel: string | null,
  onProgress?: (report: EmbedProgress) => void,
): Promise<Embedder | null> {
  const remote = await import("./remote-embedder");
  if (await remote.checkRemote()) {
    return {
      backend: "remote",
      embedQuery: (text) => remote.remoteEmbedQuery(text),
      embedPassages: (texts) => remote.remoteEmbedPassages(texts),
    };
  }

  const webgpu = await import("./webllm-transport");
  const { available } = await webgpu.checkWebGPU();

  if (available) {
    return {
      backend: "webgpu",
      embedQuery: (text) => webgpu.embedQuery(chatModel, text, (r) => onProgress?.({ progress: r.progress })),
      embedPassages: (texts) =>
        webgpu.embedPassages(chatModel, texts, (r) => onProgress?.({ progress: r.progress })),
    };
  }

  const wasm = await import("./wasm-embedder");
  if (!wasm.hasWasm()) return null;

  return {
    backend: "wasm",
    embedQuery: (text) => wasm.wasmEmbedQuery(text, onProgress),
    embedPassages: (texts) => wasm.wasmEmbedPassages(texts, onProgress),
  };
}
