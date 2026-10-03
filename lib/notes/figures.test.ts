import { describe, expect, it } from "vitest";
import { markFigures } from "./figures";

// Trees in the shape remark parses `> [!FIG] …` into.
const text = (value: string) => ({ type: "text", value });
const para = (...children: object[]) => ({ type: "paragraph", children });
const code = { type: "code", lang: "rust", value: "let s2 = s1;" };
const quote = (...children: object[]) => ({ type: "blockquote", children });
const root = (...children: object[]) => ({ type: "root", children }) as never;

type Out = { type: string; data?: { hName?: string }; children: { type: string; value?: string; data?: { hName?: string }; children?: { value?: string }[] }[] };
const captionOf = (fig: Out) => fig.children.at(-1)!;
const captionText = (fig: Out) => captionOf(fig).children!.map((c) => c.value ?? "").join("");

describe("markFigures", () => {
  it("turns a [!FIG] quote into a figure with its caption last, numbered by page", () => {
    const tree = root(quote(para(text("[!FIG] Compiler output, rustc 1.83")), code));
    markFigures(tree, 47);
    const fig = (tree as { children: Out[] }).children[0];
    expect(fig.data?.hName).toBe("figure");
    expect(fig.children.map((c) => c.type)).toEqual(["code", "paragraph"]);
    expect(captionOf(fig).data?.hName).toBe("figcaption");
    expect(captionText(fig)).toBe("Fig. 47.1 · Compiler output, rustc 1.83");
  });

  it("numbers figures in order, and without a page just counts", () => {
    const tree = root(quote(para(text("[!FIG]")), code), para(text("between")), quote(para(text("[!fig] second")), code));
    markFigures(tree, null);
    const [a, , b] = (tree as { children: Out[] }).children;
    expect(captionText(a)).toBe("Fig. 1");
    expect(captionText(b)).toBe("Fig. 2 · second");
  });

  it("keeps the text after the caption line as the figure's content", () => {
    const tree = root(quote(para(text("[!FIG] Bayes\nThe posterior is "), { type: "emphasis", children: [text("proportional")] })));
    markFigures(tree, 3);
    const fig = (tree as { children: Out[] }).children[0];
    expect(fig.children[0].children!.map((c) => c.value ?? "*")).toEqual(["The posterior is ", "*"]);
    expect(captionText(fig)).toBe("Fig. 3.1 · Bayes");
  });

  it("keeps formatting in the caption", () => {
    const tree = root(quote(para(text("[!FIG] Output of "), { type: "inlineCode", value: "rustc" }), code));
    markFigures(tree, 1);
    const cap = captionOf((tree as { children: Out[] }).children[0]);
    expect(cap.children!.map((c) => (c as { type?: string }).type)).toEqual(["text", "text", "inlineCode"]);
  });

  it("leaves ordinary quotes and other callouts alone", () => {
    const plain = quote(para(text("Just a quote")));
    const note = quote(para(text("[!NOTE] not a figure")));
    const tree = root(plain, note);
    markFigures(tree, 1);
    expect((plain as { data?: unknown }).data).toBeUndefined();
    expect((note as { data?: unknown }).data).toBeUndefined();
  });

  it("finds figures nested in lists", () => {
    const tree = root({ type: "list", children: [{ type: "listItem", children: [quote(para(text("[!FIG] In a list")), code)] }] });
    markFigures(tree, 2);
    const item = (tree as { children: { children: { children: Out[] }[] }[] }).children[0].children[0];
    expect(captionText(item.children[0])).toBe("Fig. 2.1 · In a list");
  });
});
