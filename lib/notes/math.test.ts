import { describe, expect, it } from "vitest";
import { guardDollars } from "./math";

describe("guardDollars (Pandoc's inline-maths rule)", () => {
  it("keeps real inline maths", () => {
    expect(guardDollars("Any matrix: $A = U\\Sigma V^T$.")).toBe("Any matrix: $A = U\\Sigma V^T$.");
    expect(guardDollars("between $x$ and $y$")).toBe("between $x$ and $y$");
  });

  it("escapes prices and shell variables", () => {
    expect(guardDollars("It costs $5 to $10 a month.")).toBe("It costs \\$5 to \\$10 a month.");
    expect(guardDollars("Set $HOME and $PATH first.")).toBe("Set \\$HOME and \\$PATH first.");
    expect(guardDollars("one $ sign")).toBe("one \\$ sign");
  });

  it("rejects a closing $ followed by a digit", () => {
    expect(guardDollars("$x$2")).toBe("\\$x\\$2");
  });

  it("leaves code and multi-line display maths alone", () => {
    const md = "Run `echo $HOME` then\n\n```sh\nexport A=$B\n```\n\n$$\n\\sum_i x_i\n$$";
    expect(guardDollars(md)).toBe(md);
  });

  it("turns a line that is only $$…$$ into display maths", () => {
    expect(guardDollars("Norm:\n\n$$\\|A\\|_F$$\n\nafter")).toBe("Norm:\n\n$$\n\\|A\\|_F\n$$\n\nafter");
  });

  it("keeps $$…$$ inside a sentence inline", () => {
    expect(guardDollars("so $$x^2$$ grows")).toBe("so $$x^2$$ grows");
  });

  it("keeps an already escaped dollar escaped", () => {
    expect(guardDollars("price \\$5")).toBe("price \\$5");
  });

  it("doesn't let maths span a blank line", () => {
    expect(guardDollars("$a\n\nb$")).toBe("\\$a\n\nb\\$");
  });

  it("reads LaTeX's \\(…\\) as inline maths", () => {
    expect(guardDollars("the key \\( e_K \\in E \\) is secret")).toBe("the key $e_K \\in E$ is secret");
  });

  it("reads LaTeX's \\[…\\] as display maths", () => {
    expect(guardDollars("Bayes:\n\\[P(A|B) = \\frac{P(B|A)P(A)}{P(B)}\\]\nafter")).toBe(
      "Bayes:\n\n$$\nP(A|B) = \\frac{P(B|A)P(A)}{P(B)}\n$$\n\nafter",
    );
  });

  it("leaves an escaped bracket with no closing partner alone", () => {
    expect(guardDollars("a literal \\[ bracket")).toBe("a literal \\[ bracket");
    expect(guardDollars("\\(a\n\nb\\)")).toBe("\\(a\n\nb\\)");
  });

  it("leaves LaTeX delimiters in code alone", () => {
    expect(guardDollars("`\\(x\\)`")).toBe("`\\(x\\)`");
  });
});
