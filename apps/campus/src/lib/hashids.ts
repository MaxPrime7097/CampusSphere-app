/**
 * CampusSphere 8-character deterministic reversible Hashids encoder/decoder.
 * Zero external dependencies.
 *
 * Encodes 32-bit positive integers into secure, non-sequential 8-character strings,
 * and decodes them back to the original integer ID with checksum validation.
 */

// 56 unambiguous characters (no 0/O, 1/l/I)
export const HASHID_ALPHABET = "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
const BASE = BigInt(HASHID_ALPHABET.length); // 56
const SALT = 0x5a17c9e3;

/**
 * Encodes a positive integer into an 8-character alphanumeric hashid.
 */
export function encodeHashId(id: number | string | null | undefined): string | null {
  const numId = typeof id === "string" ? Number(id) : id;
  if (!numId || !Number.isInteger(numId) || numId <= 0) return null;

  const num = BigInt(numId);
  // 10-bit checksum
  const check = BigInt(((numId ^ SALT) * 2654435761) >>> 22) & 0x3ffn;
  // Pack 32-bit id and 10-bit check: 42 bits
  let val = (num << 10n) | check;

  // Reversible 42-bit Feistel-like mixing (3 rounds)
  for (let r = 0; r < 3; r++) {
    const left = val >> 21n;
    const right = val & 0x1fffffn;
    const f = BigInt(((Number(right) ^ 0x15a4e3) * 1103515245 + 12345) & 0x1fffff);
    val = (right << 21n) | (left ^ f);
  }

  // Base56 encode into exactly 8 characters
  let res = "";
  for (let i = 0; i < 8; i++) {
    const rem = Number(val % BASE);
    val = val / BASE;
    res = HASHID_ALPHABET[rem] + res;
  }
  return res;
}

/**
 * Decodes an 8-character alphanumeric hashid back to the original integer ID.
 * Returns null if the string is invalid or fails checksum verification.
 */
export function decodeHashId(str: string | null | undefined): number | null {
  if (!str || typeof str !== "string" || str.length !== 8) return null;

  let val = 0n;
  for (let i = 0; i < 8; i++) {
    const idx = HASHID_ALPHABET.indexOf(str[i]);
    if (idx === -1) return null;
    val = val * BASE + BigInt(idx);
  }

  // Inverse Feistel (3 rounds reversed)
  for (let r = 0; r < 3; r++) {
    const left = val >> 21n;
    const right = val & 0x1fffffn;
    const f = BigInt(((Number(left) ^ 0x15a4e3) * 1103515245 + 12345) & 0x1fffff);
    val = ((right ^ f) << 21n) | left;
  }

  const num = Number(val >> 10n);
  const check = Number(val & 0x3ffn);
  const expectedCheck = ((num ^ SALT) * 2654435761) >>> 22 & 0x3ff;
  if (check !== expectedCheck || num <= 0) return null;
  return num;
}

/**
 * Parses any incoming slug or ID parameter from a URL:
 * - Direct 8-char hashid ("3Pav5Jfz") -> 42
 * - Slug ending with -[8-char hashid] ("cours-algebre-l2-3Pav5Jfz") -> 42
 * - Legacy pure numeric ID ("42") -> 42
 * - Legacy slug starting with numeric ID ("42-cours-algebre") -> 42
 */
export function parseSlugId(param: unknown): number | null {
  if (param === null || param === undefined) return null;
  if (Array.isArray(param)) param = param[0];
  if (param === null || param === undefined) return null;
  if (typeof param === "number") {
    return Number.isInteger(param) && param > 0 ? param : null;
  }

  const str = String(param).trim();
  if (!str) return null;

  // 1. Direct 8-character hashid
  if (str.length === 8) {
    const id = decodeHashId(str);
    if (id !== null) return id;
  }

  // 2. Slug ending with -[8-character hashid]
  const matchHash = str.match(/-([23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]{8})$/);
  if (matchHash) {
    const id = decodeHashId(matchHash[1]);
    if (id !== null) return id;
  }

  // 3. Backward compatibility: pure numeric ID ("42")
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    if (Number.isInteger(num) && num > 0) return num;
  }

  // 4. Backward compatibility: legacy slug starting with numeric ID ("42-titre")
  const matchLegacy = str.match(/^(\d+)(?:-.*)?$/);
  if (matchLegacy) {
    const num = Number(matchLegacy[1]);
    if (Number.isInteger(num) && num > 0) return num;
  }

  return null;
}

/**
 * Checks whether a given string is a valid 8-character Hashid.
 */
export function isHashId(str: unknown): boolean {
  if (typeof str !== "string" || str.length !== 8) return false;
  return decodeHashId(str) !== null;
}
