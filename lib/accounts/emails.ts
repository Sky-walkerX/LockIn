import { BRAND } from "@/lib/brand";
import { sendMail } from "@/lib/mail";
import { issueEmailToken } from "./email-tokens";
import { renderEmail } from "./email-layout";

// The two emails an account gets, each carrying one link: drawn like the
// notebook (./email-layout.ts), with the same words as plain text.

/** Sends the link that confirms an address. False when one went out within the last minute. */
export async function sendVerification(user: { id: string; email: string }, origin: string): Promise<boolean> {
  const token = await issueEmailToken(user.id, "verify");
  if (!token) return false;
  await sendMail({
    to: user.email,
    subject: `Confirm your email for ${BRAND.name}`,
    ...renderEmail({
      origin,
      preview: "One click and your notebook is ready.",
      heading: "Confirm your email",
      intro: [`Open this link and enter your password to confirm your address and finish setting up your ${BRAND.name} notebook.`],
      action: { label: "Confirm email", url: `${origin}/verify?token=${token}` },
      notes: ["It works for 24 hours. If you didn't sign up, ignore this email: without the password, nothing can be confirmed."],
    }),
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
    ...renderEmail({
      origin,
      preview: "The link works for one hour, once.",
      heading: "Set a new password",
      intro: [`Open this link to set a new password for your ${BRAND.name} notebook.`],
      action: { label: "Set a new password", url: `${origin}/reset?token=${token}` },
      notes: [
        "It works for one hour, once. Setting a password this way also signs you out everywhere and disconnects your agents and connected apps, which you can connect again in Settings.",
        "If you didn't ask for it, ignore this email: your password stays as it is.",
      ],
    }),
  });
  return true;
}
