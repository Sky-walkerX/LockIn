// Who runs this copy of LockIn, for its privacy and terms pages. A notebook
// someone hosts for themselves needs neither, so the pages exist only where
// OPERATOR_EMAIL is set: an instance other people are invited to sign up on.
//
// The pages speak for the operator and make promises in their name. Read them
// (app/(public)/privacy, app/(public)/terms) before turning them on.

export type Operator = {
  /** The person or organisation running the instance, when they've said. */
  name: string | null;
  /** Where to write about an account or its data. */
  email: string;
  /** Where the data is kept and for how long backups are, in the operator's words. */
  hosting: string | null;
};

export function operator(): Operator | null {
  const email = process.env.OPERATOR_EMAIL?.trim();
  if (!email) return null;
  return {
    email,
    name: process.env.OPERATOR_NAME?.trim() || null,
    hosting: process.env.OPERATOR_HOSTING?.trim() || null,
  };
}
