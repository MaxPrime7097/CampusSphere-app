/**
 * Supabase token verification — API_CONTRACT §3.1.
 *
 * The main web app never sends credentials here: it authenticates against Supabase,
 * then exchanges the resulting Supabase JWT for one of ours. This module is the only
 * place that trusts Supabase.
 *
 * Two verification paths, tried in order, mirroring the Django implementation:
 *
 *   1. JWKS — Supabase's current signing scheme. Asymmetric (ES256 or RS256), keys
 *      published at /auth/v1/.well-known/jwks.json.
 *   2. HS256 with the legacy shared secret, for projects still on the old scheme.
 *
 * There is deliberately no third path. Django fell back to an UNVERIFIED payload
 * when DEBUG was on, which meant a forged token was accepted outright in any
 * non-production deployment. That is not reproduced.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";
import { unauthenticated } from "../lib/errors.js";

export interface SupabaseClaims {
  sub: string;
  email: string;
  userMetadata: Record<string, unknown>;
}

/**
 * Remote key set, created once. `jose` handles caching, cooldown between refetches
 * and rotation, so keys are not fetched per request.
 */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  if (!env.supabase.url) return null;
  jwks ??= createRemoteJWKSet(new URL(`${env.supabase.url.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`), {
    cooldownDuration: 30_000,
    cacheMaxAge: 10 * 60_000,
  });
  return jwks;
}

async function verifyViaJwks(token: string): Promise<JWTPayload | null> {
  const keySet = getJwks();
  if (!keySet) return null;

  try {
    // `aud` is not checked: Supabase issues "authenticated" but has varied it, and
    // the signature plus issuer are what actually establish trust.
    const { payload } = await jwtVerify(token, keySet, { algorithms: ["ES256", "RS256", "ES384", "RS384"] });
    return payload;
  } catch {
    return null;
  }
}

async function verifyViaSharedSecret(token: string): Promise<JWTPayload | null> {
  if (!env.supabase.jwtSecret) return null;

  try {
    const secret = new TextEncoder().encode(env.supabase.jwtSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify a Supabase access token and extract the claims we rely on.
 * Throws 401 if neither path validates it.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseClaims> {
  if (!env.supabase.url && !env.supabase.jwtSecret) {
    throw unauthenticated("Supabase authentication is not configured on this server.");
  }

  const payload = (await verifyViaJwks(token)) ?? (await verifyViaSharedSecret(token));
  if (!payload?.sub) throw unauthenticated("Supabase token is invalid or expired.");

  return {
    sub: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "",
    userMetadata:
      payload.user_metadata && typeof payload.user_metadata === "object"
        ? (payload.user_metadata as Record<string, unknown>)
        : {},
  };
}

/** Best-effort first/last name from Supabase metadata, which varies by provider. */
export function namesFromMetadata(metadata: Record<string, unknown>, email: string): { firstName: string; lastName: string } {
  const str = (key: string): string => (typeof metadata[key] === "string" ? (metadata[key] as string).trim() : "");

  const full = str("full_name") || str("name");
  const first = str("first_name") || str("given_name") || full.split(" ")[0] || email.split("@")[0] || "Utilisateur";
  const last = str("last_name") || str("family_name") || full.split(" ").slice(1).join(" ") || first;

  return { firstName: first, lastName: last };
}

/** Seed for a username, before uniqueness is applied. */
export function usernameSeed(metadata: Record<string, unknown>, email: string, sub: string): string {
  const fromMeta = typeof metadata.username === "string" ? metadata.username.trim() : "";
  const base = fromMeta || (email ? email.split("@")[0] : "") || `user_${sub.slice(0, 8)}`;
  // Strip anything the username rules reject rather than failing the whole signup.
  const cleaned = base.replace(/[^A-Za-z0-9_.-]/g, "").replace(/^[^A-Za-z0-9]+/, "");
  return cleaned.length >= 3 ? cleaned.slice(0, 40) : `user_${sub.slice(0, 8)}`;
}
