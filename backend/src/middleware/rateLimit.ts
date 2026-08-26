/**
 * Rate-limit middleware — API_CONTRACT §5.
 *
 * | Scope                            | Limit          |
 * |----------------------------------|----------------|
 * | Anonymous (global)               | 60/hour/IP     |
 * | POST /api/sphera/guest/generate/ | 5/hour/IP      |
 * | Auth endpoints                   | see below      |
 *
 * **[CHANGE] Auth throttling actually runs now.** Django declared
 * `AuthScopedRateThrottle(ScopedRateThrottle)` with a class-level `scope = "auth"`,
 * but `ScopedRateThrottle.allow_request` reassigns `self.scope` from the *view's*
 * `throttle_scope` attribute and returns True when that attribute is missing. None
 * of the three auth views defined it, so login, registration and password reset
 * were completely unthrottled. `DEFAULT_THROTTLE_RATES` had no `auth` key either,
 * so the misconfiguration could never have surfaced as an error.
 *
 * **Login is keyed by IP *and* email, not IP alone.** CampusSphere is a campus
 * product: a whole university can share one NAT address, so an IP-only login limit
 * tight enough to stop credential stuffing would lock out an entire campus. The
 * narrow (IP, email) bucket stops a targeted brute force; the loose IP bucket stops
 * mass stuffing while leaving shared egress usable.
 */

import type { NextFunction, Request, Response } from "express";
import { consume } from "../lib/rateLimit.js";
import { throttled } from "../lib/errors.js";
import { env } from "../config/env.js";

const HOUR = 3600;

export const RATE_LIMITS = {
  /** Django's `anon: 60/hour`, ported as-is. */
  anonymous: { limit: 60, windowSeconds: HOUR },
  /** Django's `guest_generate: 5/hour`, ported as-is. */
  guestGenerate: { limit: 5, windowSeconds: HOUR },
  /** Targeted brute force against one account. */
  loginPerAccount: { limit: 10, windowSeconds: 15 * 60 },
  /** Mass credential stuffing from one address, sized to survive campus NAT. */
  loginPerIp: { limit: 100, windowSeconds: HOUR },
  /** Account creation and password-reset mail, per address. */
  registration: { limit: 30, windowSeconds: HOUR },
} as const;

/**
 * Client address.
 *
 * `trust proxy` is set in app.ts, so `req.ip` is the client rather than Render's
 * load balancer. Falls back to the socket address if the header is absent.
 */
export function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

interface RateLimitOptions {
  /** Bucket namespace, e.g. "login". */
  scope: string;
  limit: number;
  windowSeconds: number;
  /** Bucket discriminator. Defaults to the client IP. */
  key?: (req: Request) => string;
  /** Skip entirely — used to exempt authenticated callers from the anon limit. */
  skip?: (req: Request) => boolean;
}

function applyHeaders(res: Response, result: { limit: number; remaining: number; retryAfter: number }): void {
  res.setHeader("RateLimit-Limit", String(result.limit));
  res.setHeader("RateLimit-Remaining", String(result.remaining));
  res.setHeader("RateLimit-Reset", String(result.retryAfter));
}

export function rateLimit(options: RateLimitOptions) {
  const { scope, limit, windowSeconds, key = clientIp, skip } = options;

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!env.rateLimitsEnabled || skip?.(req)) {
      next();
      return;
    }

    void consume(`${scope}:${key(req)}`, limit, windowSeconds)
      .then((result) => {
        applyHeaders(res, result);
        if (result.allowed) {
          next();
          return;
        }
        res.setHeader("Retry-After", String(result.retryAfter));
        next(throttled(`Request was throttled. Expected available in ${result.retryAfter} seconds.`));
      })
      .catch(next);
  };
}

/**
 * Global anonymous limit.
 *
 * Authenticated callers are exempt, matching DRF's `AnonRateThrottle`, which keys
 * on IP only when `request.user` is anonymous. Health checks are exempt too —
 * Render polls `/api/health/` continuously from one address and would otherwise
 * consume the whole window.
 */
export const anonymousRateLimit = rateLimit({
  scope: "anon",
  ...RATE_LIMITS.anonymous,
  skip: (req) => Boolean(req.user) || req.path === "/health/" || req.path === "/health",
});
