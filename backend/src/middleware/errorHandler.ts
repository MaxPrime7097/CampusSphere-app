/**
 * Terminal error handling — API_CONTRACT §1.4.
 *
 * Two jobs: render every ApiError into the standard error envelope, and make sure
 * an unexpected throw becomes a logged 500 with a generic body rather than leaking
 * a stack trace. The Django backend returned bare framework errors from several
 * endpoints and, in a few places, swallowed real failures inside broad `except`
 * blocks so they surfaced as empty success responses instead.
 */

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors.js";
import { env } from "../config/env.js";

function envelope(res: Response, status: number, body: Record<string, unknown>): void {
  res.status(status).json({ success: false, ...body, timestamp: new Date().toISOString() });
}

export function notFoundHandler(req: Request, res: Response): void {
  envelope(res, 404, {
    error: "Not found.",
    code: "not_found",
    detail: `No route matches ${req.method} ${req.path}`,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    envelope(res, err.status, {
      error: err.message,
      code: err.code,
      ...(err.detail ? { detail: err.detail } : {}),
      ...(err.fieldErrors ? { field_errors: err.fieldErrors } : {}),
    });
    return;
  }

  // Surface AI provider failures explicitly so the client sees exactly which API keys or models failed
  if (err && typeof err === "object" && "name" in err && err.name === "AllProvidersFailedError") {
    envelope(res, 503, {
      error: (err as any).message,
      code: "ai_providers_failed",
      attempts: (err as any).attempts,
    });
    return;
  }

  // Zod validation failures are client errors, not server errors.
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "non_field_errors";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    envelope(res, 400, { error: "Validation failed.", code: "bad_request", field_errors: fieldErrors });
    return;
  }

  // Body-parser rejects malformed JSON with a 400-flavoured SyntaxError.
  if (err instanceof SyntaxError && "body" in err) {
    envelope(res, 400, { error: "Malformed JSON body.", code: "bad_request" });
    return;
  }

  console.error(`[error] unhandled on ${req.method} ${req.originalUrl}`, err);
  envelope(res, 500, {
    error: "An unexpected error occurred.",
    code: "internal_error",
    ...(env.debug && err instanceof Error ? { detail: err.stack } : {}),
  });
}
