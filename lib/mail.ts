import nodemailer, { type Transporter } from "nodemailer";
import { BRAND } from "@/lib/brand";

// Outgoing email, for the two links an account needs: confirming an address
// and setting a new password. Optional: with no SMTP_HOST there is no email,
// sign-up doesn't ask for a confirmation and a forgotten password is reset by
// whoever runs the instance (see the README).

/** Whether this instance can send email at all. */
export function mailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

let transport: Transporter | undefined;

function transporter(): Transporter {
  const port = Number(process.env.SMTP_PORT) || 587;
  return (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 speaks TLS from the first byte; other ports upgrade with STARTTLS.
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
  }));
}

/** Sends an email, as plain text and, when given, HTML too. Throws when the server refuses it. */
export async function sendMail(message: { to: string; subject: string; text: string; html?: string }): Promise<void> {
  const from = process.env.SMTP_FROM || `${BRAND.name} <${process.env.SMTP_USER ?? "noreply@localhost"}>`;
  await transporter().sendMail({ from, ...message });
}
