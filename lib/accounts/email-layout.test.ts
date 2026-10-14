import { describe, expect, it } from "vitest";
import { renderEmail } from "./email-layout";

const email = {
  origin: "https://notebook.test",
  preview: "Preview line",
  heading: "Set a new password",
  intro: ["Open this link <b>now</b>."],
  action: { label: "Set a new password", url: "https://notebook.test/reset?token=abc&x=1" },
  notes: ["It works for one hour."],
};

describe("renderEmail", () => {
  it("carries the link in both parts, the same words in each", () => {
    const { html, text } = renderEmail(email);
    expect(html).toContain('href="https://notebook.test/reset?token=abc&amp;x=1"');
    expect(text).toContain("https://notebook.test/reset?token=abc&x=1");
    expect(text).toContain("It works for one hour.");
    expect(html).toContain("Preview line");
  });

  it("writes everything it's given as text, never as markup", () => {
    const { html } = renderEmail(email);
    expect(html).toContain("Open this link &lt;b&gt;now&lt;/b&gt;.");
    expect(html).not.toContain("<b>now</b>");
  });

  it("names where it came from", () => {
    expect(renderEmail(email).html).toContain(">notebook.test</a>");
    expect(renderEmail(email).html).toContain("your AI tools");
  });
});
