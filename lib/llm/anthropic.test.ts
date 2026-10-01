import { describe, expect, it } from "vitest";
import { readEvent, toAnthropicRequest } from "./anthropic";

describe("toAnthropicRequest", () => {
  it("takes the system prompt out of the turns", () => {
    const req = toAnthropicRequest([
      { role: "system", content: "You are LockIn." },
      { role: "system", content: "Context: notes." },
      { role: "user", content: "Hi" },
    ]);
    expect(req.system).toBe("You are LockIn.\n\nContext: notes.");
    expect(req.messages).toEqual([{ role: "user", content: "Hi" }]);
  });

  it("merges back-to-back turns from one side so they alternate", () => {
    const req = toAnthropicRequest([
      { role: "user", content: "One" },
      { role: "user", content: "Two" },
      { role: "assistant", content: "Reply" },
      { role: "user", content: "Three" },
    ]);
    expect(req.messages).toEqual([
      { role: "user", content: "One\n\nTwo" },
      { role: "assistant", content: "Reply" },
      { role: "user", content: "Three" },
    ]);
  });

  it("starts with a user turn even when the history doesn't", () => {
    const req = toAnthropicRequest([
      { role: "assistant", content: "Earlier reply" },
      { role: "user", content: "Follow-up" },
    ]);
    expect(req.messages[0].role).toBe("user");
    expect(req.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });
});

describe("readEvent", () => {
  it("reads streamed text", () => {
    expect(readEvent('{"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hel"}}')).toEqual({ text: "Hel" });
  });

  it("surfaces an error event", () => {
    expect(readEvent('{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}')).toEqual({ error: "Overloaded" });
  });

  it("ignores everything else, including frames it can't parse", () => {
    expect(readEvent('{"type":"message_start","message":{}}')).toEqual({});
    expect(readEvent('{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"…"}}')).toEqual({});
    expect(readEvent("{not json")).toEqual({});
  });
});
