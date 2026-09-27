import { describe, expect, it } from "vitest";
import { codeText, type HastNode } from "./code-text";

const text = (value: string): HastNode => ({ type: "text", value });
const el = (tagName: string, children: HastNode[]): HastNode => ({ type: "element", tagName, children });
const pre = (...children: HastNode[]) => el("pre", [el("code", children)]);

describe("codeText", () => {
  it("joins the text split across highlight spans", () => {
    const node = pre(el("span", [text("for")]), text(" (int j = i * i; j <= n; j += i)\n"));
    expect(codeText(node)).toBe("for (int j = i * i; j <= n; j += i)");
  });

  it("keeps indentation and inner newlines", () => {
    const node = pre(text("  if (isPrime[i]) {\n    isPrime[j] = 0;\n  }\n"));
    expect(codeText(node)).toBe("  if (isPrime[i]) {\n    isPrime[j] = 0;\n  }");
  });

  it("drops only the one newline markdown appends to a block", () => {
    expect(codeText(pre(text("return 0;\n\n")))).toBe("return 0;\n");
  });

  it("returns an empty string when there is no node", () => {
    expect(codeText(undefined)).toBe("");
  });
});
