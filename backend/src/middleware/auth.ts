/**
 * Authentication middleware.
 *
 * `attachUser` is permissive and runs globally: several routes are legitimately
 * dual-mode (`/api/users/auth/me/` answers `authenticated:false` rather than 401,
 * and public resource reads vary their payload by viewer). `requireAuth` is the
 * explicit gate.
 */

import type { NextFunction, Request, Response } from "express";
import { bearerToken, verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { forbidden, unauthenticated } from "../lib/errors.js";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
  isActive: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Set when a token was supplied but rejected, for diagnostics only. */
      authError?: string;
    }
  }
}

/** Resolve the bearer token to a user when possible. Never rejects the request. */
export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = bearerToken(req.header("authorization"));
  if (!token) return next();

  try {
    const claims = verifyToken(token, "access");
    const user = await prisma.user.findUnique({
      where: { id: claims.user_id },
      select: { id: true, username: true, email: true, isStaff: true, isSuperuser: true, isActive: true },
    });
    if (user && user.isActive) req.user = user;
    else req.authError = user ? "inactive_account" : "unknown_user";
  } catch (error) {
    req.authError = error instanceof Error ? error.message : "invalid_token";
  }
  next();
}

/** Gate a route on authentication. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw unauthenticated(req.authError ?? "Authentication credentials were not provided.");
  next();
}

/**
 * Gate a route on platform-admin privileges.
 * Role resolution matches the Django matrix: superuser -> super_admin,
 * staff -> admin, otherwise no admin access.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) throw unauthenticated();
  if (!req.user.isStaff && !req.user.isSuperuser) throw forbidden("Admin access required.");
  next();
}

/** The authenticated user, or throw. Convenience for handlers behind `requireAuth`. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated();
  return req.user;
}
