/**
 * Password hashing — argon2id.
 *
 * Django used PBKDF2-SHA256. No accounts are being preserved, so there is no
 * verify-and-upgrade path to maintain: every hash in the new database is argon2id
 * from the start.
 *
 * Only the standalone Sphera app uses password auth; the main web app is
 * Supabase-only and those users have `passwordHash = null`.
 */

import { hash, verify, Algorithm } from "@node-rs/argon2";

const OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456, // 19 MiB — OWASP minimum for argon2id
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

let decoy: Promise<string> | null = null;

/**
 * A throwaway hash to verify against when no account matches, so a login attempt
 * for an unknown email costs the same as one for a known email. Without it, the
 * absence of a record short-circuits the expensive verify and the timing
 * difference enumerates registered addresses.
 *
 * Computed once per process and cached.
 */
export function decoyHash(): Promise<string> {
  decoy ??= hash("decoy-password-for-constant-time-login", OPTIONS);
  return decoy;
}

/**
 * Verify a password. Returns false rather than throwing on a malformed or absent
 * hash, so a Supabase-only account (null hash) simply fails password login
 * instead of producing a 500.
 */
export async function verifyPassword(plain: string, hashed: string | null): Promise<boolean> {
  if (!hashed) return false;
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}
