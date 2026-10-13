/** A failed API call: the message the route gave, its status, and the rest of
 *  what it sent (a 409 carries the record as it now stands). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: Record<string, unknown> | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Parse a fetch Response as JSON, throwing the API's error message on failure. */
export async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status, body);
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
