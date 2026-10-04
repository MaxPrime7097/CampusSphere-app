/**
 * Trailing-slash canonicalisation — API_CONTRACT §1.1.
 *
 * Every client builds URLs with a trailing slash and Django's APPEND_SLASH
 * redirected the slashless form implicitly. Express has no equivalent, so this has
 * to be explicit or any stray request 404s.
 *
 * 308 rather than 301: a 301 permits the client to downgrade a POST to GET on
 * redirect, which would silently turn a write into a read. 308 preserves method
 * and body.
 */

import type { NextFunction, Request, Response } from "express";

export function appendSlash(req: Request, res: Response, next: NextFunction): void {
  const [path, query] = req.originalUrl.split("?");

  // Already canonical, or a file-like path that should not gain a slash.
  if (path.endsWith("/") || path.split("/").pop()?.includes(".")) {
    return next();
  }

  res.redirect(308, `${path}/${query ? `?${query}` : ""}`);
}

/**
 * Cache-Control policy:
 * - `no-store` for all mutating actions (POST, PUT, PATCH, DELETE).
 * - `no-cache` for GET/HEAD requests so browsers and clients cache the response and revalidate
 *   conditionally with `If-None-Match: <etag>` for 304 Not Modified responses.
 */
export function noStore(req: Request, res: Response, next: NextFunction): void {
  const mutating = req.method !== "GET" && req.method !== "HEAD";

  if (mutating) {
    res.setHeader("Cache-Control", "no-store");
  } else {
    res.setHeader("Cache-Control", "no-cache");
  }
  next();
}
