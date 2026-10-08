/**
 * Supabase-backed auth handlers — API_CONTRACT §3.1.
 *
 * Exported as handlers rather than a router because each is mounted twice: once at
 * its canonical path under /api/auth/, and once at the DEPRECATED duplicate under
 * /api/users/auth/. The duplicates are retained per the migration policy (nothing is
 * dropped) but must behave identically — in Django the duplicate exchange endpoint
 * referenced an undefined `SUPABASE_ANON_KEY` and 500'd unconditionally.
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { issueTokenPair } from "../lib/jwt.js";
import { loadUserCounts } from "../lib/userCounts.js";
import { isProfileComplete, serializeUser, userSelect } from "../serializers/user.js";
import { ok } from "../lib/envelope.js";
import { badRequest } from "../lib/errors.js";
import { currentUser } from "../middleware/auth.js";
import { namesFromMetadata, usernameSeed, verifySupabaseToken } from "../services/supabase.js";

const exchangeSchema = z
  .object({
    // The web client sends `access_token`; older payloads used `supabase_token`.
    // Both are accepted so neither client needs changing.
    access_token: z.string().min(1).optional(),
    supabase_token: z.string().min(1).optional(),
  })
  .refine((d) => d.access_token || d.supabase_token, {
    message: "access_token is required.",
    path: ["access_token"],
  });

/** Reserve a unique username, suffixing on collision rather than rejecting signup. */
async function reserveUsername(seed: string): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? seed : `${seed}${attempt}`;
    const taken = await prisma.user.findFirst({
      where: { username: { equals: candidate, mode: "insensitive" } },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  // Practically unreachable; guarantees termination without a unique-constraint throw.
  return `${seed}_${Date.now().toString(36)}`;
}

/**
 * POST /api/auth/supabase/exchange/
 * Verify a Supabase JWT and mint our own token pair, creating the account on first sight.
 */
export async function supabaseExchange(req: Request, res: Response): Promise<void> {
  const input = exchangeSchema.parse(req.body ?? {});
  const claims = await verifySupabaseToken((input.access_token ?? input.supabase_token)!);

  // Match on the Supabase id first, then on email — the latter covers an account
  // that originally signed up with a password and later linked an OAuth provider.
  let user = await prisma.user.findFirst({ where: { supabaseUid: claims.sub }, select: userSelect });
  let isNewUser = false;

  if (!user && claims.email) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: claims.email, mode: "insensitive" } },
      select: { id: true, supabaseUid: true },
    });
    if (byEmail) {
      if (byEmail.supabaseUid !== claims.sub) {
        try {
          user = await prisma.user.update({
            where: { id: byEmail.id },
            data: { supabaseUid: claims.sub },
            select: userSelect,
          });
        } catch {
          // If the update collided due to a race condition, fetch the resolved record
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { supabaseUid: claims.sub },
                { id: byEmail.id },
              ],
            },
            select: userSelect,
          });
        }
      } else {
        user = await prisma.user.findFirst({ where: { id: byEmail.id }, select: userSelect });
      }
    }
  }

  if (!user) {
    isNewUser = true;
    const { firstName, lastName } = namesFromMetadata(claims.userMetadata, claims.email);
    const rawDob =
      typeof claims.userMetadata.date_of_birth === "string"
        ? claims.userMetadata.date_of_birth
        : typeof claims.userMetadata.dateOfBirth === "string"
        ? claims.userMetadata.dateOfBirth
        : null;
    const dateOfBirth = parseDateOfBirth(rawDob);

    try {
      user = await prisma.user.create({
        data: {
          supabaseUid: claims.sub,
          email: claims.email || `${claims.sub}@supabase.local`,
          username: await reserveUsername(usernameSeed(claims.userMetadata, claims.email, claims.sub)),
          firstName,
          lastName,
          dateOfBirth,
          // No local password: this account authenticates through Supabase only.
          passwordHash: null,
        },
        select: userSelect,
      });
    } catch (createErr) {
      if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
        // Concurrency collision on supabaseUid, email, or username: recover by finding existing user
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { supabaseUid: claims.sub },
              ...(claims.email ? [{ email: { equals: claims.email, mode: "insensitive" as const } }] : []),
            ],
          },
          select: userSelect,
        });

        if (!user) {
          // The collision was purely on the chosen username; retry with a guaranteed unique username
          const safeUniqueUsername = `${usernameSeed(claims.userMetadata, claims.email, claims.sub).slice(0, 30)}_${Date.now().toString(36)}`;
          user = await prisma.user.create({
            data: {
              supabaseUid: claims.sub,
              email: claims.email || `${claims.sub}@supabase.local`,
              username: safeUniqueUsername,
              firstName,
              lastName,
              dateOfBirth,
              passwordHash: null,
            },
            select: userSelect,
          });
        }
      } else {
        throw createErr;
      }
    }
  }

  if (!user) {
    throw badRequest("Impossible de finaliser l'authentification.");
  }

  // [CHANGE] Derived, never stored. Django recomputed it from an empty required-field
  // list, so `all([]) === true` force-wrote completion on every single login and
  // permanently defeated onboarding.
  const complete = isProfileComplete(user);

  res.status(200).json({
    success: true,
    data: {
      tokens: issueTokenPair(user.id),
      user: serializeUser(user, { viewerId: user.id, counts: await loadUserCounts(user.id) }),
      is_new_user: isNewUser,
      needs_profile_completion: !complete,
    },
    timestamp: new Date().toISOString(),
  });
}

const jsonArray = z.array(z.record(z.unknown()));

/**
 * Onboarding payload.
 *
 * Deliberately permissive: this runs during signup, where rejecting a request
 * strands the user with a half-created account. Unparseable optional values are
 * dropped rather than treated as errors. Only `username` is structurally enforced,
 * because it is unique and user-visible.
 */
const completeProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone_number: z.string().max(30).optional(),
  date_of_birth: z.string().nullable().optional(),
  university: z.string().max(100).optional(),
  faculty: z.string().max(100).optional(),
  study_year: z.string().max(20).optional(),
  student_id: z.string().max(50).optional(),
  campus: z.string().max(100).optional(),
  town: z.string().max(100).optional(),
  language: z.union([z.array(z.string()), z.string()]).optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  previous_education: jsonArray.optional(),
  experiences: jsonArray.optional(),
  portfolio_links: jsonArray.optional(),
});

const MINIMUM_AGE = 16;

function getAgeFromDate(birthDate: Date, today = new Date()): number {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/** Accept the several date shapes the clients have historically sent. */
function parseDateOfBirth(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const parsed = dmy ? new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`) : new Date(raw);
  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) return null;
  return parsed;
}

/**
 * POST /api/auth/supabase/complete-profile/
 * Fill in the onboarding fields. Idempotent: re-submitting an already-complete
 * profile updates it rather than erroring.
 */
export async function supabaseCompleteProfile(req: Request, res: Response): Promise<void> {
  const me = currentUser(req);
  const input = completeProfileSchema.parse(req.body ?? {});

  const data: Prisma.UserUpdateInput = {};

  if (input.username) {
    const desired = input.username.trim();
    const taken = await prisma.user.findFirst({
      where: { username: { equals: desired, mode: "insensitive" }, id: { not: me.id } },
      select: { id: true },
    });
    // Suffix rather than reject: a 400 here strands the user mid-onboarding with no
    // obvious recovery, which is exactly the failure the old flow produced.
    data.username = taken ? await reserveUsername(desired) : desired;
  }

  if (input.first_name !== undefined) data.firstName = input.first_name;
  if (input.last_name !== undefined) data.lastName = input.last_name;
  if (input.phone_number !== undefined) data.phoneNumber = input.phone_number;
  if (input.university !== undefined) data.university = input.university;
  if (input.faculty !== undefined) data.faculty = input.faculty;
  if (input.study_year !== undefined) data.studyYear = input.study_year;
  if (input.student_id !== undefined) data.studentId = input.student_id;
  if (input.campus !== undefined) data.campus = input.campus;
  if (input.town !== undefined) data.town = input.town;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.skills !== undefined) data.skills = input.skills;
  if (input.interests !== undefined) data.interests = input.interests;
  if (input.previous_education !== undefined) data.previousEducation = input.previous_education as Prisma.InputJsonValue;
  if (input.experiences !== undefined) data.experiences = input.experiences as Prisma.InputJsonValue;
  if (input.portfolio_links !== undefined) data.portfolioLinks = input.portfolio_links as Prisma.InputJsonValue;
  if (input.date_of_birth !== undefined) {
    const parsed = parseDateOfBirth(input.date_of_birth);
    if (parsed && getAgeFromDate(parsed) < MINIMUM_AGE) {
      throw badRequest(`Vous devez avoir au moins ${MINIMUM_AGE} ans.`, {
        date_of_birth: [`Vous devez avoir au moins ${MINIMUM_AGE} ans.`],
      });
    }
    data.dateOfBirth = parsed;
  }
  if (input.language !== undefined) {
    data.language = Array.isArray(input.language) ? input.language : [input.language];
  }

  const user = await prisma.user.update({ where: { id: me.id }, data, select: userSelect });
  ok(res, serializeUser(user, { viewerId: me.id, counts: await loadUserCounts(me.id) }), "Profil complété avec succès");
}

/**
 * GET /api/auth/supabase/debug/
 *
 * @status DEPRECATED — diagnostic only, retained per migration policy.
 *
 * Admin-gated. Django left this open to anonymous callers and it disclosed which
 * secrets were configured plus the JWKS key set, which is reconnaissance handed out
 * for free.
 */
export async function supabaseDebug(_req: Request, res: Response): Promise<void> {
  let jwksReachable = false;
  let jwksError: string | null = null;
  let keyCount = 0;

  if (env.supabase.url) {
    try {
      const response = await fetch(`${env.supabase.url.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`, {
        signal: AbortSignal.timeout(5000),
      });
      jwksReachable = response.ok;
      if (response.ok) {
        const body = (await response.json()) as { keys?: unknown[] };
        keyCount = body.keys?.length ?? 0;
      } else {
        jwksError = `HTTP ${response.status}`;
      }
    } catch (error) {
      jwksError = error instanceof Error ? error.message : "unknown error";
    }
  }

  ok(res, {
    node: process.version,
    supabase_url_set: Boolean(env.supabase.url),
    supabase_jwt_secret_set: Boolean(env.supabase.jwtSecret),
    supabase_service_role_key_set: Boolean(env.supabase.serviceRoleKey),
    jwks_reachable: jwksReachable,
    jwks_key_count: keyCount,
    jwks_error: jwksError,
  });
}

/**
 * POST /api/users/auth/password-reset/
 *
 * @status DEPRECATED — Supabase owns password reset; the web client calls
 * `supabase.auth.resetPasswordForEmail` directly. Retained so the surface is
 * complete, and deliberately does not reveal whether an address is registered.
 */
export async function passwordReset(req: Request, res: Response): Promise<void> {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequest("A valid email is required.", { email: ["Invalid email."] });

  ok(res, null, "If this email exists, a password reset link has been sent.");
}

