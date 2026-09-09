/**
 * Typed API errors mapping onto the status codes in API_CONTRACT §1.4.
 *
 * Throwing these rather than returning ad-hoc responses is what keeps the error
 * envelope uniform. The Django backend returned at least four different error
 * shapes depending on which layer failed, and several endpoints leaked 500s for
 * conditions that were really 400s or 404s.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    options: { code?: string; detail?: string; fieldErrors?: Record<string, string[]> } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code ?? defaultCode(status);
    this.detail = options.detail;
    this.fieldErrors = options.fieldErrors;
  }
}

function defaultCode(status: number): string {
  switch (status) {
    case 400: return "bad_request";
    case 401: return "unauthenticated";
    case 403: return "permission_denied";
    case 404: return "not_found";
    case 409: return "conflict";
    case 413: return "payload_too_large";
    case 429: return "throttled";
    case 503: return "service_unavailable";
    default: return "error";
  }
}

export const badRequest = (message: string, fieldErrors?: Record<string, string[]>) =>
  new ApiError(400, message, { fieldErrors });

export const unauthenticated = (message = "Authentication credentials were not provided.") =>
  new ApiError(401, message);

export const forbidden = (message = "You do not have permission to perform this action.") =>
  new ApiError(403, message);

/**
 * Used both for genuinely absent records and for records hidden by visibility
 * rules — API_CONTRACT §1.4 requires that the two be indistinguishable, so
 * existence is never leaked to an unauthorised caller.
 */
export const notFound = (message = "Not found.") => new ApiError(404, message);

export const conflict = (message: string, fieldErrors?: Record<string, string[]>) =>
  new ApiError(409, message, { fieldErrors });

export const payloadTooLarge = (message: string) => new ApiError(413, message);

export const throttled = (message = "Too many requests.") => new ApiError(429, message);

/** All AI providers in the fallback chain failed. */
export const serviceUnavailable = (message: string, detail?: string) =>
  new ApiError(503, message, { detail });
