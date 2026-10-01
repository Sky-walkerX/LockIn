/**
 * The user's model connections: cloud providers with their own key, servers
 * on their own machine, and the in-browser model.
 *
 * These live in localStorage, not the database, on purpose: an endpoint like
 * `http://localhost:11434` is a property of the machine this browser runs on,
 * not of the account, and an API key typed here never reaches LockIn's server.
 * The browser talks to the provider directly.
 *
 * The rest of the app reads one `LlmSettings`: the active connection plus the
 * settings that apply to all of them. `provider` picks the transport
 * (`create-transport.ts`).
 */
export type LlmProvider = "openai" | "anthropic" | "webllm";

export type PresetId =
  | "anthropic"
  | "openai"
  | "gemini"
  | "openrouter"
  | "ollama"
  | "lmstudio"
  | "llamacpp"
  | "custom"
  | "webllm";

export type Connection = {
  id: string;
  name: string;
  preset: PresetId;
  provider: LlmProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  webllmModel: string;
  contextTokens: number;
  temperature: number;
};

export type LlmStore = {
  version: 2;
  connections: Connection[];
  /** The connection Ask uses until another is picked. */
  activeId: string | null;
  ragEnabled: boolean;
};

export type LlmSettings = Connection & { ragEnabled: boolean };

export const STORAGE_KEY = "lockin.llm";

export type Preset = {
  id: PresetId;
  label: string;
  provider: LlmProvider;
  baseUrl: string;
  /** Cloud presets need a key and send the question to the provider. */
  cloud: boolean;
  contextTokens: number;
  keyPlaceholder?: string;
  keyUrl?: string;
};

// Cloud models take far more context than the 8k a laptop runs comfortably;
// 32k is generous for notes without making every question expensive.
export const PRESETS: Preset[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    cloud: true,
    contextTokens: 32000,
    keyPlaceholder: "sk-ant-…",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    label: "OpenAI",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    cloud: true,
    contextTokens: 32000,
    keyPlaceholder: "sk-…",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    label: "Gemini",
    provider: "openai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    cloud: true,
    contextTokens: 32000,
    keyPlaceholder: "AIza…",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    provider: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    cloud: true,
    contextTokens: 32000,
    keyPlaceholder: "sk-or-…",
    keyUrl: "https://openrouter.ai/settings/keys",
  },
  { id: "ollama", label: "Ollama", provider: "openai", baseUrl: "http://localhost:11434/v1", cloud: false, contextTokens: 8000 },
  { id: "lmstudio", label: "LM Studio", provider: "openai", baseUrl: "http://localhost:1234/v1", cloud: false, contextTokens: 8000 },
  { id: "llamacpp", label: "llama.cpp", provider: "openai", baseUrl: "http://localhost:8080/v1", cloud: false, contextTokens: 8000 },
  { id: "custom", label: "Other server", provider: "openai", baseUrl: "", cloud: false, contextTokens: 8000 },
  { id: "webllm", label: "In this browser", provider: "webllm", baseUrl: "", cloud: false, contextTokens: 2500 },
];

export function presetFor(id: PresetId): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === "custom")!;
}

export const DEFAULT_WEBLLM_MODEL = "Qwen3-1.7B-q4f16_1-MLC";

// No WebLLM model exceeds 4,096 tokens of context. The
// stored default of 8,000 would silently overflow that window.
export const WEBLLM_CONTEXT_CEILING = 2500;

const DEFAULT_TEMPERATURE = 0.3;

export const EMPTY_STORE: LlmStore = { version: 2, connections: [], activeId: null, ragEnabled: true };

/** What the app reads when nothing is connected yet. */
export const DEFAULT_SETTINGS: LlmSettings = {
  ...newConnection("custom", "none"),
  name: "",
  ragEnabled: true,
};

export function newConnection(preset: PresetId, id: string = crypto.randomUUID()): Connection {
  const p = presetFor(preset);
  return {
    id,
    name: p.label,
    preset: p.id,
    provider: p.provider,
    baseUrl: p.baseUrl,
    apiKey: "",
    model: "",
    webllmModel: DEFAULT_WEBLLM_MODEL,
    contextTokens: p.contextTokens,
    temperature: DEFAULT_TEMPERATURE,
  };
}

/** The ceiling actually sent to `prepare`: clamped for WebLLM regardless of
 *  what's stored. */
export function effectiveContextTokens(settings: Pick<Connection, "provider" | "contextTokens">): number {
  return settings.provider === "webllm" ? Math.min(settings.contextTokens, WEBLLM_CONTEXT_CEILING) : settings.contextTokens;
}

/** The single-connection settings stored before connections existed. */
type LegacySettings = {
  provider?: "openai" | "webllm";
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  webllmModel?: string;
  contextTokens?: number;
  temperature?: number;
  ragEnabled?: boolean;
};

/**
 * Reads what's stored under `lockin.llm`, converting the older single
 * connection into a list so nobody has to set their model up again. The
 * converted ids are fixed, so reading twice before the first save agrees.
 */
export function parseStore(raw: string | null): LlmStore {
  if (!raw) return EMPTY_STORE;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_STORE;
  }
  if (!parsed || typeof parsed !== "object") return EMPTY_STORE;

  if ((parsed as { version?: unknown }).version === 2) {
    const store = parsed as Partial<LlmStore>;
    const connections = Array.isArray(store.connections)
      ? store.connections.map((c) => ({ ...newConnection(c.preset ?? "custom", c.id), ...c }))
      : [];
    return {
      version: 2,
      connections,
      activeId: store.activeId ?? null,
      ragEnabled: store.ragEnabled ?? true,
    };
  }

  const old = parsed as LegacySettings;
  const shared = {
    contextTokens: old.contextTokens ?? 8000,
    temperature: old.temperature ?? DEFAULT_TEMPERATURE,
  };
  const connections: Connection[] = [];
  if (old.baseUrl?.trim()) {
    const baseUrl = normalizeBaseUrl(old.baseUrl);
    const preset = PRESETS.find((p) => p.baseUrl && p.baseUrl === baseUrl)?.id ?? "custom";
    connections.push({
      ...newConnection(preset, "migrated-server"),
      ...shared,
      baseUrl,
      apiKey: old.apiKey ?? "",
      model: old.model ?? "",
    });
  }
  if (old.provider === "webllm") {
    connections.push({
      ...newConnection("webllm", "migrated-browser"),
      ...shared,
      webllmModel: old.webllmModel || DEFAULT_WEBLLM_MODEL,
    });
  }
  const active = old.provider === "webllm" ? "migrated-browser" : "migrated-server";
  return {
    version: 2,
    connections,
    activeId: connections.some((c) => c.id === active) ? active : (connections[0]?.id ?? null),
    ragEnabled: old.ragEnabled ?? true,
  };
}

export function loadStore(): LlmStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    return parseStore(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_STORE;
  }
}

export function saveStore(store: LlmStore): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function activeConnection(store: LlmStore): Connection | null {
  return store.connections.find((c) => c.id === store.activeId) ?? store.connections[0] ?? null;
}

export function settingsFrom(store: LlmStore): LlmSettings {
  const active = activeConnection(store);
  return active ? { ...active, ragEnabled: store.ragEnabled } : { ...DEFAULT_SETTINGS, ragEnabled: store.ragEnabled };
}

/** The active connection and shared settings, as the rest of the app reads them. */
export function loadSettings(): LlmSettings {
  return settingsFrom(loadStore());
}

export function isConfigured(settings: Pick<Connection, "provider" | "webllmModel" | "baseUrl" | "model">): boolean {
  if (settings.provider === "webllm") return settings.webllmModel.trim().length > 0;
  return settings.baseUrl.trim().length > 0 && settings.model.trim().length > 0;
}

/** The model a connection answers with, for labels and the saved reply. */
export function modelName(settings: Pick<Connection, "provider" | "webllmModel" | "model">): string {
  return settings.provider === "webllm" ? settings.webllmModel : settings.model;
}

const PRIVATE_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[?::1\]?|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.+\.local)$/i;

/**
 * Whether a connection keeps everything on this machine or network: the
 * in-browser model, or a server at a private address. Anything else sends the
 * text it's given to someone else's computer, so it's treated as cloud.
 */
export function isLocalConnection(settings: Pick<Connection, "provider" | "baseUrl">): boolean {
  if (settings.provider === "webllm") return true;
  if (settings.provider === "anthropic") return false;
  try {
    return PRIVATE_HOST.test(new URL(settings.baseUrl).hostname);
  } catch {
    return false;
  }
}

/** Where a cloud connection sends questions, for "Sent to …" labels. */
export function destination(settings: Pick<Connection, "preset" | "baseUrl">): string {
  const preset = presetFor(settings.preset);
  if (preset.cloud) return preset.label;
  try {
    return new URL(settings.baseUrl).hostname;
  } catch {
    return "this server";
  }
}

/** Trailing slashes would double up against the `/chat/completions` suffix. */
export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}
