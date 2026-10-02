"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { checkAuthorizeRequest, responseUrl, type AuthorizeParams } from "@/lib/oauth/authorize";
import { requestOrigin } from "@/lib/oauth/origin";
import { createCode } from "@/lib/oauth/server";

const KEYS = ["response_type", "client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"] as const;

/**
 * Allow or Cancel on the consent page. The request is checked again from
 * scratch rather than trusted from the form. A server action, so Next refuses
 * it from any other site: a page elsewhere can't approve on the user's behalf.
 */
export async function decide(formData: FormData) {
  const params: AuthorizeParams = {};
  for (const key of KEYS) {
    const v = formData.get(key);
    if (typeof v === "string" && v) params[key] = v;
  }
  const origin = await requestOrigin();
  const check = await checkAuthorizeRequest(params, origin);
  if (check.kind === "redirect") redirect(check.url);
  if (check.kind === "show-error") throw new Error(check.message);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  if (formData.get("decision") !== "allow") {
    redirect(responseUrl(check.redirectUri, { error: "access_denied", state: check.state, iss: origin }));
  }
  const code = await createCode({
    clientId: check.client.id,
    userId,
    redirectUri: check.redirectUri,
    codeChallenge: check.codeChallenge,
    resource: check.resource,
  });
  redirect(responseUrl(check.redirectUri, { code, state: check.state, iss: origin }));
}
