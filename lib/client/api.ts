/* ==========================================================================
   Front-end API client (H2O).

   Typed functions that call the backend routes, so wiring a screen is a
   one-liner instead of hand-rolled fetch() in every component. Safe to import
   from client components — these only use fetch and shared *types* (no server
   code is pulled into the browser bundle).

   Base helper: JSON in, JSON out, throws a typed ApiError on failure so screens
   can show the server's message.
   ========================================================================== */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  const data = await res.json().catch(() => ({}) as unknown);
  if (!res.ok) {
    const message = (data as { error?: string })?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}
