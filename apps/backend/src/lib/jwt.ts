/**
 * JWT issuing and verification — API_CONTRACT §1.2.
 *
 * Claims deliberately include BOTH `user_id` (what the Django SimpleJWT tokens
 * carried, and what any surviving client code may read) and the standard `sub`.
 * Algorithm stays HS256 over SECRET_KEY, and lifetimes stay 7d / 90d, so the
 * token format is a drop-in replacement.
 */

import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { unauthenticated } from "./errors.js";

export type TokenType = "access" | "refresh";

export interface TokenClaims {
  sub: string;
  user_id: number;
  token_type: TokenType;
  jti: string;
  iat: number;
  exp: number;
}

function sign(userId: number, type: TokenType, ttlSeconds: number): string {
  return jwt.sign(
    { sub: String(userId), user_id: userId, token_type: type, jti: randomUUID() },
    env.secretKey,
    { algorithm: "HS256", expiresIn: ttlSeconds },
  );
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function issueTokenPair(userId: number): TokenPair {
  return {
    accessToken: sign(userId, "access", env.jwt.accessTtlSeconds),
    refreshToken: sign(userId, "refresh", env.jwt.refreshTtlSeconds),
  };
}

export function issueAccessToken(userId: number): string {
  return sign(userId, "access", env.jwt.accessTtlSeconds);
}

/** Verify and return claims, or throw a 401. Never returns a partially-trusted token. */
export function verifyToken(token: string, expected: TokenType): TokenClaims {
  let claims: TokenClaims;
  try {
    claims = jwt.verify(token, env.secretKey, { algorithms: ["HS256"] }) as TokenClaims;
  } catch (error) {
    const reason = error instanceof jwt.TokenExpiredError ? "Token has expired." : "Token is invalid.";
    throw unauthenticated(reason);
  }

  if (claims.token_type !== expected) {
    throw unauthenticated(`Expected a ${expected} token.`);
  }
  return claims;
}

/** Extract a bearer token from an Authorization header, if present and well-formed. */
export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim() || null;
}
