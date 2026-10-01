"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, ExternalLink, Loader2, Plus, X } from "lucide-react";
import { listConnectionModels } from "@/lib/llm/create-transport";
import {
  DEFAULT_WEBLLM_MODEL,
  PRESETS,
  destination,
  isLocalConnection,
  modelName,
  newConnection,
  normalizeBaseUrl,
  presetFor,
  saveStore,
  type Connection,
  type LlmStore,
  type Preset,
  type PresetId,
} from "@/lib/llm/settings";
import { useIndexing } from "@/hooks/useChat";
import { IndexStatus } from "./index-status";

/**
 * The user's model connections: a list, a form for one, and the presets a new
 * one starts from.
 *
 * "Test connection" / "Load model" is each kind's primary action rather than a
 * nicety: a wrong base URL and a blocked origin look identical from the panel,
 * a mistyped key looks like a dead server, and a multi-gigabyte download with
 * no feedback is indistinguishable from a hang. Proving the thing works is
 * what makes the rest of the sheet usable.
 */

const CURATED_WEBLLM_MODELS: { id: string; label: string; download: string; note: string }[] = [
  { id: "gemma3-1b-it-q4f16_1-MLC", label: "Gemma 3 1B", download: "711 MB", note: "Floor. Weak machines and slow connections." },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", download: "879 MB", note: "Floor, better instruction-following." },
  { id: "Qwen3-1.7B-q4f16_1-MLC", label: "Qwen3 1.7B", download: "2,037 MB", note: "Default. Best quality per MB — emits <think>." },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B", download: "2,264 MB", note: "Strongest grounded Q&A in this tier." },
  { id: "Phi-4-mini-instruct-q4f16_1-MLC", label: "Phi-4 mini", download: "3,438 MB", note: "Tuned for source-grounded answering." },
  { id: "Qwen3.5-4B-q4f16_1-MLC", label: "Qwen3.5 4B", download: "3,868 MB", note: "Best synthesis that still fits a 6 GB GPU." },
  { id: "Llama-3.1-8B-Instruct-q4f16_1-MLC", label: "Llama 3.1 8B", download: "5,001 MB", note: "Ceiling. Needs 8 GB VRAM." },
];

const LABEL = "lk-print mb-1.5 block text-2xs uppercase tracking-wide text-muted-foreground";
const FIELD =
  "lk-print w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-foreground";

type Screen = { kind: "list" } | { kind: "add" } | { kind: "edit"; draft: Connection; isNew: boolean };

type SetField = <K extends keyof Connection>(key: K, value: Connection[K]) => void;

export function SettingsSheet({
  store,
  onChange,
  onClose,
}: {
  store: LlmStore;
  onChange: (next: LlmStore) => void;
  onClose: () => void;
}) {
  // A first visit has nothing to list, so it opens on the presets.
  const [screen, setScreen] = useState<Screen>(store.connections.length === 0 ? { kind: "add" } : { kind: "list" });

  const commit = (next: LlmStore) => {
    saveStore(next);
    onChange(next);
  };

  const saveConnection = (draft: Connection, isNew: boolean) => {
    const cleaned = { ...draft, baseUrl: normalizeBaseUrl(draft.baseUrl), name: draft.name.trim() || presetFor(draft.preset).label };
    const connections = isNew
      ? [...store.connections, cleaned]
      : store.connections.map((c) => (c.id === cleaned.id ? cleaned : c));
    // A connection just set up is the one the user means to try.
    commit({ ...store, connections, activeId: isNew || !store.activeId ? cleaned.id : store.activeId });
    setScreen({ kind: "list" });
  };

  const removeConnection = (id: string) => {
    const connections = store.connections.filter((c) => c.id !== id);
    commit({ ...store, connections, activeId: store.activeId === id ? (connections[0]?.id ?? null) : store.activeId });
    setScreen(connections.length === 0 ? { kind: "add" } : { kind: "list" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {screen.kind !== "list" && store.connections.length > 0 && (
            <button type="button" onClick={() => setScreen({ kind: "list" })} className="lk-iconbtn" aria-label="Back to models">
              <ArrowLeft size={15} />
            </button>
          )}
          <span className="lk-sec">
            {screen.kind === "add" ? "add a model" : screen.kind === "edit" ? screen.draft.name || "model" : "models"}
          </span>
        </div>
        <button type="button" onClick={onClose} className="lk-iconbtn" aria-label="Close settings">
          <X size={15} />
        </button>
      </div>

      {screen.kind === "list" && (
        <ConnectionList
          store={store}
          onEdit={(c) => setScreen({ kind: "edit", draft: c, isNew: false })}
          onAdd={() => setScreen({ kind: "add" })}
          onRag={(ragEnabled) => commit({ ...store, ragEnabled })}
        />
      )}
      {screen.kind === "add" && (
        <PresetPicker onPick={(preset) => setScreen({ kind: "edit", draft: newConnection(preset), isNew: true })} />
      )}
      {screen.kind === "edit" && (
        <ConnectionForm
          key={screen.draft.id}
          initial={screen.draft}
          isNew={screen.isNew}
          ragEnabled={store.ragEnabled}
          onSave={(draft) => saveConnection(draft, screen.isNew)}
          onDelete={screen.isNew ? undefined : () => removeConnection(screen.draft.id)}
        />
      )}
    </div>
  );
}

function kindLabel(c: Connection): string {
  if (c.provider === "webllm") return "browser";
  return isLocalConnection(c) ? "local" : "cloud";
}

function ConnectionList({
  store,
  onEdit,
  onAdd,
  onRag,
}: {
  store: LlmStore;
  onEdit: (c: Connection) => void;
  onAdd: () => void;
  onRag: (on: boolean) => void;
}) {
  const activeId = store.activeId ?? store.connections[0]?.id;
  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
      <div>
        <ul className="divide-y divide-border rounded-md border border-border">
          {store.connections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onEdit(c)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm">
                    {c.name}
                    {c.id === activeId && <span className="lk-tag">in use</span>}
                  </span>
                  <span className="lk-print block truncate text-2xs text-muted-foreground">
                    {kindLabel(c)} · {modelName(c) || "no model chosen"}
                  </span>
                </span>
                <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onAdd} className="lk-btn mt-3 flex items-center gap-1.5 px-3 py-2 text-2xs">
          <Plus size={13} /> Add a model
        </button>
        <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
          Pick which one answers from the list at the top of Ask.
        </p>
      </div>

      <div>
        <label htmlFor="lk-rag" className="flex items-center justify-between gap-2 py-1">
          <span className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">Search notes for context</span>
          <input
            id="lk-rag"
            type="checkbox"
            checked={store.ragEnabled}
            onChange={(e) => onRag(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
        <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
          When your notebook is too big to send whole, find the passages that answer the question instead of
          trimming. Runs on your GPU where WebGPU is available and your CPU everywhere else.
        </p>
      </div>
    </div>
  );
}

function PresetPicker({ onPick }: { onPick: (preset: PresetId) => void }) {
  const groups: { title: string; note: string; presets: Preset[] }[] = [
    {
      title: "With your own key",
      note: "Your browser sends each question, and the notes it uses, straight to the provider.",
      presets: PRESETS.filter((p) => p.cloud),
    },
    {
      title: "On your machine",
      note: "A model server you run, like Ollama. Nothing leaves your network.",
      presets: PRESETS.filter((p) => !p.cloud && p.provider === "openai"),
    },
    {
      title: "In this browser",
      note: "Downloads a small model once and runs it on your GPU.",
      presets: PRESETS.filter((p) => p.provider === "webllm"),
    },
  ];
  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className={LABEL}>{g.title}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {g.presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p.id)}
                className="rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors hover:border-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">{g.note}</p>
        </div>
      ))}
    </div>
  );
}

function ConnectionForm({
  initial,
  isNew,
  ragEnabled,
  onSave,
  onDelete,
}: {
  initial: Connection;
  isNew: boolean;
  ragEnabled: boolean;
  onSave: (draft: Connection) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<Connection>(initial);
  const set: SetField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const preset = presetFor(draft.preset);

  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div>
          <label htmlFor="lk-name" className={LABEL}>
            Name
          </label>
          <input id="lk-name" value={draft.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" className={FIELD} />
        </div>

        {draft.provider === "webllm" ? (
          <WebllmSettings draft={draft} set={set} ragEnabled={ragEnabled} />
        ) : (
          <ServerSettings draft={draft} set={set} preset={preset} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lk-ctx" className={LABEL}>
              Context budget
            </label>
            <input
              id="lk-ctx"
              type="number"
              min={500}
              step={500}
              disabled={draft.provider === "webllm"}
              value={draft.provider === "webllm" ? 2500 : draft.contextTokens}
              onChange={(e) => set("contextTokens", Number(e.target.value))}
              className={`${FIELD} disabled:opacity-50`}
            />
            {draft.provider === "webllm" && (
              <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">Capped for WebLLM&apos;s 4k window.</p>
            )}
          </div>
          <div>
            <label htmlFor="lk-temp" className={LABEL}>
              Temperature
            </label>
            <input
              id="lk-temp"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={draft.temperature}
              onChange={(e) => set("temperature", Number(e.target.value))}
              className={FIELD}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        <button type="button" onClick={() => onSave(draft)} className="lk-btn flex-1 px-3 py-2 text-2xs">
          {isNew ? "Add" : "Save"}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="lk-print px-2 text-2xs uppercase tracking-wide text-muted-foreground underline underline-offset-2 transition-colors hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>
    </>
  );
}

function ServerSettings({ draft, set, preset }: { draft: Connection; set: SetField; preset: Preset }) {
  const [models, setModels] = useState<string[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const cloud = !isLocalConnection(draft);
  const canTest = draft.baseUrl.trim().length > 0 && (!preset.cloud || draft.apiKey.trim().length > 0);

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const found = await listConnectionModels({ ...draft, baseUrl: normalizeBaseUrl(draft.baseUrl) });
      setModels(found);
      if (found.length === 0) {
        setResult({ ok: false, message: "Connected, but no models are available." });
      } else {
        setResult({ ok: true, message: `Connected · ${found.length} model${found.length === 1 ? "" : "s"}` });
        // Nothing chosen yet, or the choice is gone: take the first available
        // so the user can send a message without a second trip through here.
        if (!draft.model || !found.includes(draft.model)) set("model", found[0]);
      }
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "Connection failed." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {!preset.cloud && (
        <div>
          <label htmlFor="lk-base-url" className={LABEL}>
            Server URL
          </label>
          <input
            id="lk-base-url"
            value={draft.baseUrl}
            onChange={(e) => set("baseUrl", e.target.value)}
            placeholder="http://localhost:11434/v1"
            spellCheck={false}
            autoComplete="off"
            className={FIELD}
          />
        </div>
      )}

      <div>
        <label htmlFor="lk-api-key" className={LABEL}>
          API key {!preset.cloud && <span className="normal-case tracking-normal">(optional)</span>}
        </label>
        <input
          id="lk-api-key"
          type="password"
          value={draft.apiKey}
          onChange={(e) => set("apiKey", e.target.value)}
          placeholder={preset.keyPlaceholder ?? "Leave empty for local servers"}
          autoComplete="off"
          spellCheck={false}
          className={FIELD}
        />
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {preset.keyUrl && (
            <a
              href={preset.keyUrl}
              target="_blank"
              rel="noreferrer"
              className="lk-print flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Get a key <ExternalLink size={10} />
            </a>
          )}
          {draft.apiKey && (
            <button
              type="button"
              onClick={() => set("apiKey", "")}
              className="lk-print text-2xs uppercase tracking-wide text-muted-foreground underline underline-offset-2 hover:text-destructive"
            >
              Forget key
            </button>
          )}
        </div>
        <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
          Kept in this browser only. LockIn&apos;s server never sees it.
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={test}
          disabled={testing || !canTest}
          className="lk-btn flex items-center gap-1.5 px-3 py-2 text-2xs disabled:opacity-40"
        >
          {testing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {preset.cloud ? "Check key" : "Test connection"}
        </button>
        {result && (
          <p className={`mt-2 text-2xs leading-relaxed ${result.ok ? "text-muted-foreground" : "text-destructive"}`}>
            {result.message}
          </p>
        )}
        {result && !result.ok && !cloud && <CorsHelp />}
      </div>

      <div>
        <label htmlFor="lk-model" className={LABEL}>
          Model
        </label>
        {models && models.length > 0 ? (
          <select id="lk-model" value={draft.model} onChange={(e) => set("model", e.target.value)} className={FIELD}>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="lk-model"
            value={draft.model}
            onChange={(e) => set("model", e.target.value)}
            placeholder={preset.cloud ? "Check the key to list models" : "llama3.1:8b"}
            spellCheck={false}
            autoComplete="off"
            className={FIELD}
          />
        )}
      </div>

      {cloud && (
        <p className="lk-card p-3 text-2xs leading-relaxed text-muted-foreground">
          Questions, and the notes used to answer them, go from this browser to {destination(draft)} under your key.
          Note autocomplete stays off for cloud models.
        </p>
      )}
    </>
  );
}

function WebllmSettings({ draft, set, ragEnabled }: { draft: Connection; set: SetField; ragEnabled: boolean }) {
  const [webGpuAvailable, setWebGpuAvailable] = useState<boolean | null>(null);
  const [webGpuReason, setWebGpuReason] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [allModels, setAllModels] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ progress: number; text: string } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const indexing = useIndexing({ ...draft, ragEnabled });

  useEffect(() => {
    let cancelled = false;
    import("@/lib/llm/webllm-transport").then(async ({ checkWebGPU }) => {
      const res = await checkWebGPU();
      if (!cancelled) {
        setWebGpuAvailable(res.available);
        if (!res.available && res.reason) {
          setWebGpuReason(res.reason);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadShowAll = async () => {
    setShowAll(true);
    if (allModels) return;
    const { listWebllmChatModels } = await import("@/lib/llm/webllm-transport");
    setAllModels(listWebllmChatModels());
  };

  const load = async () => {
    setLoading(true);
    setResult(null);
    setProgress(null);
    try {
      const { preloadEngine } = await import("@/lib/llm/webllm-transport");
      await preloadEngine(draft.webllmModel || DEFAULT_WEBLLM_MODEL, (report) =>
        setProgress({ progress: report.progress, text: report.text }),
      );
      setResult({ ok: true, message: "Model loaded and cached — ready to chat." });
    } catch (error) {
      console.error("Failed to load WebLLM model:", error);
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : String(error || "Failed to load the model.");
      setResult({ ok: false, message });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    const { clearModelCache } = await import("@/lib/llm/webllm-transport");
    const { WEBLLM_EMBEDDING_MODEL } = await import("@/lib/rag/embedding-model");
    await Promise.all([clearModelCache(draft.webllmModel || DEFAULT_WEBLLM_MODEL), clearModelCache(WEBLLM_EMBEDDING_MODEL)]);
    setResult({ ok: true, message: "Cached weights cleared." });
  };

  if (webGpuAvailable === false) {
    return (
      <div className="lk-card p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {webGpuReason ||
            "This browser has no WebGPU, so an in-browser model can't run here. Use a local server instead, or switch to a browser with WebGPU support (recent Chrome or Edge)."}
        </p>
      </div>
    );
  }

  const models = showAll && allModels ? allModels : CURATED_WEBLLM_MODELS.map((m) => m.id);

  return (
    <>
      <div>
        <label className={LABEL}>Model</label>
        <div className="space-y-1.5">
          {models.map((id) => {
            const meta = CURATED_WEBLLM_MODELS.find((m) => m.id === id);
            const on = draft.webllmModel === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set("webllmModel", id)}
                aria-pressed={on}
                className={`lk-print block w-full rounded-md border px-2.5 py-2 text-left text-2xs transition-colors ${
                  on ? "border-foreground" : "border-border hover:border-foreground/50"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{meta?.label ?? id}</span>
                  {meta && <span className="text-2xs uppercase tracking-wide text-muted-foreground">{meta.download}</span>}
                </span>
                {meta && <span className="mt-0.5 block text-2xs leading-relaxed text-muted-foreground">{meta.note}</span>}
              </button>
            );
          })}
        </div>
        {!showAll && (
          <button
            type="button"
            onClick={() => void loadShowAll()}
            className="lk-print mt-2 flex items-center gap-1 text-2xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown size={11} /> show all {allModels?.length ?? 163}
          </button>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={load}
          disabled={loading || !draft.webllmModel}
          className="lk-btn flex items-center gap-1.5 px-3 py-2 text-2xs disabled:opacity-40"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Download &amp; load
        </button>
        <button
          type="button"
          onClick={() => void clearCache()}
          className="lk-print ml-2 text-2xs uppercase tracking-wide text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Clear cached weights
        </button>

        {loading && progress && (
          <div className="mt-2.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-[width]"
                style={{ width: `${Math.round(Math.min(1, Math.max(0, progress.progress)) * 100)}%` }}
              />
            </div>
            <p className="lk-print mt-1.5 text-2xs text-muted-foreground">{progress.text}</p>
          </div>
        )}
        {result && (
          <p className={`mt-2 text-2xs leading-relaxed ${result.ok ? "text-muted-foreground" : "text-destructive"}`}>
            {result.message}
          </p>
        )}
      </div>

      <div className="lk-card p-3">
        <IndexStatus indexing={indexing} variant="settings" />
      </div>
    </>
  );
}

/**
 * Shown on any failed local connection. A browser reports a blocked
 * cross-origin request as an indistinguishable network error, and allowing the
 * origin is the fix people miss, so the commands are spelled out rather than
 * linked.
 */
function CorsHelp() {
  const origin = typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;

  return (
    <div className="lk-card mt-3 p-3">
      <p className="lk-print text-2xs uppercase tracking-wide text-muted-foreground">If the server is running</p>
      <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
        It must allow requests from <span className="lk-print text-foreground">{origin}</span>.
      </p>
      <pre className="lk-print mt-2 overflow-x-auto rounded-md bg-muted px-2.5 py-2 text-2xs leading-relaxed">
        {`# Ollama
OLLAMA_ORIGINS=${origin} ollama serve

# Ollama, macOS app
launchctl setenv OLLAMA_ORIGINS "${origin}"
# then restart Ollama`}
      </pre>
      <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">LM Studio: enable CORS in the local server tab.</p>
    </div>
  );
}
