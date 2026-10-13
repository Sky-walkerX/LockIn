import { BRAND } from "@/lib/brand";
import { sendMail } from "@/lib/mail";
import { issueEmailToken } from "./email-tokens";

// The two emails an account gets. Plain text: they carry one link each.

/** Sends the link that confirms an address. False when one went out within the last minute. */
export async function sendVerification(user: { id: string; email: string }, origin: string): Promise<boolean> {
  const token = await issueEmailToken(user.id, "verify");
  if (!token) return false;
  await sendMail({
    to: user.email,
    subject: `Confirm your email for ${BRAND.name}`,
    text: [
      `Open this link to confirm your address and finish setting up your ${BRAND.name} notebook:`,
      "",
      `${origin}/verify?token=${token}`,
      "",
      "It works for 24 hours. If you didn't sign up, ignore this email and nothing happens.",
    ].join("\n"),
  });
  return true;
}

/** Sends the link that sets a new password. False when one went out within the last minute. */
export async function sendPasswordReset(user: { id: string; email: string }, origin: string): Promise<boolean> {
  const token = await issueEmailToken(user.id, "reset");
  if (!token) return false;
  await sendMail({
    to: user.email,
    subject: `Set a new ${BRAND.name} password`,
    text: [
      `Open this link to set a new password for your ${BRAND.name} notebook:`,
      "",
      `${origin}/reset?token=${token}`,
      "",
      "It works for one hour, once. If you didn't ask for it, ignore this email: your password stays as it is.",
    ].join("\n"),
  });
  return true;
}
