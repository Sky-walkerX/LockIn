import type { ChatTransport } from "./transport";
import { createOpenAiTransport, listModels } from "./client";
import { createAnthropicTransport, listAnthropicModels } from "./anthropic";
import type { Connection } from "./settings";

/** The transport for a connection. The in-browser engine loads on demand, so
 *  nobody downloads WebLLM's code just to talk to a server. */
export async function createTransport(connection: Connection): Promise<ChatTransport> {
  if (connection.provider === "webllm") {
    return (await import("./webllm-transport")).createWebllmTransport(connection.webllmModel);
  }
  if (connection.provider === "anthropic") return createAnthropicTransport(connection);
  return createOpenAiTransport(connection);
}

/** Models a server connection offers, for the settings list. */
export function listConnectionModels(connection: Connection): Promise<string[]> {
  return connection.provider === "anthropic" ? listAnthropicModels(connection) : listModels(connection);
}
