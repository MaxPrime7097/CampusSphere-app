/**
 * Black-box HTTP client for the contract suite.
 *
 * Deliberately framework-agnostic: it speaks only HTTP against API_BASE_URL, so the
 * same suite runs against the Django backend (where it documents current
 * behaviour and fails on every known defect) and against the Node backend (where
 * it is the acceptance gate). Nothing here may import application code.
 */

/**
 * Target server.
 *
 * Named API_BASE_URL, not BASE_URL: Vite (and therefore Vitest) reserves BASE_URL
 * for its own public base path and injects `process.env.BASE_URL = "/"`, which
 * silently overrides anything set on the command line.
 */
export const API_BASE_URL = (process.env.API_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

export interface ApiResponse<T = any> {
  status: number;
  headers: Headers;
  body: T;
  /** Raw text, for non-JSON responses (file downloads, ZIPs). */
  raw: string;
}

export interface RequestOptions {
  method?: string;
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Issue a request. Never throws on non-2xx — status is part of the contract. */
export async function request<T = any>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", token, body, headers = {} } = options;
  const url = `${API_BASE_URL}/${path.replace(/^\//, "")}`;

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders: Record<string, string> = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    redirect: "follow",
  });

  const raw = await res.text();
  let parsed: any = null;
  if ((res.headers.get("content-type") ?? "").includes("application/json")) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  return { status: res.status, headers: res.headers, body: parsed as T, raw };
}

/** Substitute positional values into a `<var>` path template. */
export function fillPath(template: string, ...values: Array<string | number>): string {
  let i = 0;
  return template.replace(/<var>/g, () => String(values[i++] ?? 1));
}

// ── Envelope assertions (API_CONTRACT §1.3, §1.4) ──────────────────────────

export function expectEnvelope(res: ApiResponse): void {
  if (res.body === null) {
    throw new Error(`Expected a JSON envelope, got non-JSON (status ${res.status}): ${res.raw.slice(0, 200)}`);
  }
  if (typeof res.body.success !== "boolean") {
    throw new Error(`Envelope is missing a boolean \`success\`: ${JSON.stringify(res.body).slice(0, 200)}`);
  }
}

export function expectSuccessEnvelope(res: ApiResponse): void {
  expectEnvelope(res);
  if (res.body.success !== true) {
    throw new Error(`Expected success:true, got ${JSON.stringify(res.body).slice(0, 200)}`);
  }
  if (!("data" in res.body)) {
    throw new Error("Success envelope is missing `data`");
  }
}

export function expectListEnvelope(res: ApiResponse): void {
  expectSuccessEnvelope(res);
  if (!Array.isArray(res.body.data)) {
    throw new Error(`List envelope \`data\` must be an array, got ${typeof res.body.data}`);
  }
}

export function expectErrorEnvelope(res: ApiResponse): void {
  expectEnvelope(res);
  if (res.body.success !== false) {
    throw new Error(`Expected success:false on status ${res.status}`);
  }
}

/**
 * `unwrapList` in the client matches on `success !== undefined && Array.isArray(data)`.
 * Any list response that fails this silently yields `[]` in the UI rather than erroring,
 * so it is asserted explicitly.
 */
export function expectClientUnwrappable(res: ApiResponse): void {
  const b = res.body;
  const ok =
    Array.isArray(b) ||
    (b?.success !== undefined && Array.isArray(b?.data)) ||
    Array.isArray(b?.results) ||
    Array.isArray(b?.data?.results);
  if (!ok) {
    throw new Error(`Response is not unwrappable by the client's unwrapList: ${JSON.stringify(b).slice(0, 200)}`);
  }
}
