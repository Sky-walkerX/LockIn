import { BRAND } from "@/lib/brand";

// How LockIn's emails look: the notebook's cover in miniature (green cloth,
// the cream label with the name on it), a heading in the label's lettering,
// and one button. Built from tables and inline styles, which is what mail apps
// draw reliably, and from text rather than images, which many of them block
// until asked. The same message goes as plain text alongside.

export type EmailContent = {
  /** The line mail apps show after the subject in the inbox. */
  preview: string;
  heading: string;
  /** Paragraphs before the button. */
  intro: string[];
  action: { label: string; url: string };
  /** Smaller paragraphs after it: how long the link lasts, what if it wasn't you. */
  notes: string[];
  /** Where this notebook is, for the footer. */
  origin: string;
};

const INK = "#1b2a2f";
const MUTED = "#5d6b6e";
const CLOTH = "#24453b";
const LABEL = "#f7f5ee";
const PAPER = "#f1efe7";
const CARD = "#fdfcf8";
const RULE = "#dcd8cb";
const DISPLAY = "'Barlow Condensed','Arial Narrow','Helvetica Neue',Arial,sans-serif";
const SERIF = "Spectral,Georgia,'Times New Roman',serif";
const SANS = "Barlow,'Helvetica Neue',Arial,sans-serif";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function renderEmail(email: EmailContent): { html: string; text: string } {
  const host = new URL(email.origin).host;
  const paragraph = (text: string, style: string) => `<p style="margin:0 0 16px;${style}">${escape(text)}</p>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(email.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};" bgcolor="${PAPER}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escape(email.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="background-color:${PAPER};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="max-width:560px;background-color:${CARD};border:1px solid ${RULE};border-radius:6px;overflow:hidden;">
<tr><td bgcolor="${CLOTH}" style="background-color:${CLOTH};padding:22px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${LABEL}" style="background-color:${LABEL};border:1px solid #d9d5c7;border-radius:2px;padding:6px 12px;font-family:${DISPLAY};font-size:20px;font-weight:700;letter-spacing:0.06em;color:${INK};text-transform:uppercase;">${escape(BRAND.name)}</td>
</tr></table>
</td></tr>
<tr><td style="padding:32px 32px 8px;">
<h1 style="margin:0 0 18px;font-family:${DISPLAY};font-size:28px;line-height:1.1;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;color:${INK};">${escape(email.heading)}</h1>
${email.intro.map((t) => paragraph(t, `font-family:${SERIF};font-size:17px;line-height:1.6;color:${INK};`)).join("\n")}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
<td bgcolor="${INK}" style="background-color:${INK};border-radius:4px;">
<a href="${escape(email.action.url)}" style="display:inline-block;padding:13px 26px;font-family:${DISPLAY};font-size:15px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${LABEL};text-decoration:none;">${escape(email.action.label)}</a>
</td></tr></table>
${email.notes.map((t) => paragraph(t, `font-family:${SANS};font-size:14px;line-height:1.55;color:${MUTED};`)).join("\n")}
<p style="margin:0 0 24px;font-family:${SANS};font-size:13px;line-height:1.5;color:${MUTED};">If the button doesn't work, open this address:<br><a href="${escape(email.action.url)}" style="color:${CLOTH};word-break:break-all;">${escape(email.action.url)}</a></p>
</td></tr>
<tr><td style="border-top:1px solid ${RULE};padding:16px 32px 20px;font-family:${SANS};font-size:12px;line-height:1.5;color:${MUTED};">
${escape(BRAND.name)}: ${escape(BRAND.tagline.charAt(0).toLowerCase() + BRAND.tagline.slice(1))}. Sent by <a href="${escape(email.origin)}" style="color:${MUTED};">${escape(host)}</a>.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [...email.intro, "", email.action.url, "", ...email.notes.flatMap((t) => [t, ""]), `${BRAND.name} · ${email.origin}`].join("\n");
  return { html, text };
}
