/** Parse a fetch Response as JSON, throwing the API's error message on failure. */
export async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const jsonHeaders = { "Content-Type": "application/json" };

/** Thin wrappers around fetch that always send the session cookie + JSON. */
export const api = {
  get: <T>(url: string) => fetch(url, { credentials: "include" }).then((r) => asJson<T>(r)),
  post: <T>(url: string, body: unknown) =>
    fetch(url, { method: "POST", credentials: "include", headers: jsonHeaders, body: JSON.stringify(body) }).then((r) => asJson<T>(r)),
  put: <T>(url: string, body: unknown) =>
    fetch(url, { method: "PUT", credentials: "include", headers: jsonHeaders, body: JSON.stringify(body) }).then((r) => asJson<T>(r)),
  del: <T>(url: string) =>
    fetch(url, { method: "DELETE", credentials: "include" }).then((r) => asJson<T>(r)),
};
