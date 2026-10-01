import { describe, expect, it } from "vitest";
import { isLocalConnection, newConnection, parseStore, settingsFrom } from "./settings";

describe("parseStore", () => {
  it("starts empty with nothing stored, or something unreadable", () => {
    expect(parseStore(null).connections).toEqual([]);
    expect(parseStore("not json").connections).toEqual([]);
  });

  it("turns an older local-server setup into one connection, keeping every value", () => {
    const store = parseStore(
      JSON.stringify({
        provider: "openai",
        baseUrl: "http://localhost:11434/v1/",
        model: "llama3.1:8b",
        apiKey: "",
        webllmModel: "Qwen3-1.7B-q4f16_1-MLC",
        contextTokens: 12000,
        temperature: 0.5,
        ragEnabled: false,
      }),
    );
    expect(store.connections).toHaveLength(1);
    expect(store.connections[0]).toMatchObject({
      preset: "ollama",
      name: "Ollama",
      provider: "openai",
      baseUrl: "http://localhost:11434/v1",
      model: "llama3.1:8b",
      contextTokens: 12000,
      temperature: 0.5,
    });
    expect(store.activeId).toBe(store.connections[0].id);
    expect(store.ragEnabled).toBe(false);
  });

  it("keeps both connections when an older setup used the in-browser model", () => {
    const store = parseStore(
      JSON.stringify({ provider: "webllm", baseUrl: "http://example.lan:9000/v1", model: "m", webllmModel: "Llama-3.2-1B-Instruct-q4f16_1-MLC" }),
    );
    expect(store.connections.map((c) => [c.preset, c.provider])).toEqual([
      ["custom", "openai"],
      ["webllm", "webllm"],
    ]);
    expect(settingsFrom(store)).toMatchObject({ provider: "webllm", webllmModel: "Llama-3.2-1B-Instruct-q4f16_1-MLC" });
  });

  it("converts the same way every time, so the active id holds before the first save", () => {
    const raw = JSON.stringify({ provider: "openai", baseUrl: "http://localhost:1234/v1", model: "qwen" });
    expect(parseStore(raw)).toEqual(parseStore(raw));
  });

  it("reads the current format and fills fields added later", () => {
    const stored = { version: 2, connections: [{ id: "a", preset: "anthropic", apiKey: "sk-ant-x", model: "claude" }], activeId: "a", ragEnabled: true };
    const store = parseStore(JSON.stringify(stored));
    expect(store.connections[0]).toMatchObject({
      id: "a",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      apiKey: "sk-ant-x",
      contextTokens: 32000,
    });
  });

  it("falls back to the first connection when the active one is gone", () => {
    const store = parseStore(JSON.stringify({ version: 2, connections: [newConnection("openai", "x")], activeId: "deleted", ragEnabled: true }));
    expect(settingsFrom(store).id).toBe("x");
  });
});

describe("isLocalConnection", () => {
  const at = (baseUrl: string) => isLocalConnection({ provider: "openai", baseUrl });

  it("counts the in-browser model and servers on this machine or network as local", () => {
    expect(isLocalConnection({ provider: "webllm", baseUrl: "" })).toBe(true);
    expect(at("http://localhost:11434/v1")).toBe(true);
    expect(at("http://127.0.0.1:8080/v1")).toBe(true);
    expect(at("http://192.168.1.20:1234/v1")).toBe(true);
    expect(at("http://gpu-box.local:8000/v1")).toBe(true);
  });

  it("counts providers and public servers as cloud", () => {
    expect(isLocalConnection({ provider: "anthropic", baseUrl: "https://api.anthropic.com/v1" })).toBe(false);
    expect(at("https://api.openai.com/v1")).toBe(false);
    expect(at("https://openrouter.ai/api/v1")).toBe(false);
    expect(at("not a url")).toBe(false);
  });
});
