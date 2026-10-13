// Reasons a sign-in is turned away that the sign-in page explains, shared by
// the server (lib/authOptions.ts) and the page.

/** A correct password for an address that hasn't been confirmed yet. */
export const EMAIL_NOT_VERIFIED = "email-not-verified";

/** `?error=` values NextAuth sends the sign-in page to, in the user's words. */
export const SIGN_IN_ERRORS: Record<string, string> = {
  AccountExists:
    "There's already a notebook for that address, made with a password and never confirmed. Sign in with the password, or use “Forgot password” to take it over.",
  SignupClosed: "Sign-up is closed on this notebook, so a new account can't be made.",
  AccessDenied: "That sign-in was refused.",
  OAuthAccountNotLinked: "That sign-in was refused.",
};
