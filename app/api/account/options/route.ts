import { mailConfigured } from "@/lib/mail";
import { canCreateAccount } from "@/lib/accounts/policy";

// GET /api/account/options - what the sign-in pages may offer on this
// instance: whether new accounts can be made, and whether it can send email
// (confirmation and password-reset links). Read when the page loads, since
// the pages themselves are prerendered and these are set where it runs.
export async function GET() {
  return Response.json(
    { signup: await canCreateAccount(), mail: mailConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
