import type { PromptMessage } from "@/lib/chat/types";
import type { ChatTransport, StreamOpts } from "./transport";
import { asNetworkError, describeHttpError, LlmError } from "./client";
import { normalizeBaseUrl, type Connection } from "./settings";

/**
 * Browser-side transport to Anthropic's Messages API, with the user's own key.
 * Anthropic answers browsers directly once a request says it means to (the
 * `anthropic-dangerous-direct-browser-access` header): the risk that header
 * names is shipping your own key to other people's browsers, which isn't what
 * happens here: the key is the user's, typed into their own browser.
 */

type AnthropicSettings = Pick<Connection, "baseUrl" | "apiKey" | "model" | "temperature" | "provider">;

const VERSION = "2023-06-01";
// Enough for a long, cited answer; the reply streams, so it costs nothing until used.
const MAX_TOKENS = 4096;

function headers(settings: AnthropicSettings): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": settings.apiKey.trim(),
    "anthropic-version": VERSION,
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

export type AnthropicRequest = {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

/**
 * Anthropic takes the system prompt on its own and the turns as alternating
 * user and assistant messages starting with the user, so system messages are
 * pulled out and joined, and back-to-back turns from one side are merged.
 */
export function toAnthropicRequest(messages: PromptMessage[]): AnthropicRequest {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const turns: AnthropicRequest["messages"] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else turns.push({ role: m.role, content: m.content });
  }
  if (turns[0]?.role === "assistant") turns.unshift({ role: "user", content: "(continuing)" });
  return { system, messages: turns };
}

/** One server-sent event's data: text to add, an error to stop on, or nothing. */
export function readEvent(payload: string): { text?: string; error?: string } {
  try {
    const event = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
      error?: { message?: string };
    };
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") return { text: event.delta.text ?? "" };
    if (event.type === "error") return { error: event.error?.message ?? "Anthropic returned an error." };
  } catch {
    // A frame we can't parse is not worth killing a good stream over.
  }
  return {};
}

async function* streamMessages(settings: AnthropicSettings, messages: PromptMessage[], opts: StreamOpts): AsyncGenerator<string> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const { system, messages: turns } = toAnthropicRequest(messages);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: headers(settings),
      signal: opts.signal,
      body: JSON.stringify({
        model: settings.model,
        max_tokens: MAX_TOKENS,
        ...(system ? { system } : {}),
        messages: turns,
        // Anthropic's range is 0 to 1; the shared setting allows up to 2.
        temperature: Math.min(1, Math.max(0, settings.temperature)),
        stream: true,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw asNetworkError(settings);
  }

  if (!response.ok) {
    if (response.status === 404) throw new LlmError("Anthropic doesn't recognise that model. Pick one from the list.", "model");
    if (response.status === 529) throw new LlmError("Anthropic is overloaded right now. Try again shortly.", "server");
    throw await describeHttpError(response, baseUrl);
  }
  if (!response.body) throw new LlmError("Anthropic sent an empty response.", "server");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // A chunk can split an event mid-line, so the trailing partial waits.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const { text, error } = readEvent(trimmed.slice(5).trim());
      if (error) throw new LlmError(error, "server");
      if (text) yield text;
    }
  }
}

/** Model ids the key can use, newest first, for the settings list. */
export async function listAnthropicModels(settings: AnthropicSettings): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/models?limit=100`, { headers: headers(settings) });
  } catch {
    throw asNetworkError(settings);
  }
  if (!response.ok) throw await describeHttpError(response, baseUrl);
  const body = (await response.json()) as { data?: { id?: string }[] };
  return (body.data ?? []).map((m) => m.id).filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function createAnthropicTransport(settings: AnthropicSettings): ChatTransport {
  return {
    listModels: () => listAnthropicModels(settings),
    streamChat: (messages, opts) => streamMessages(settings, messages, opts),
  };
}
