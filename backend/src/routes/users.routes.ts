/**
 * Users and native authentication — mounted at /api/users/.
 *
 * Native register/login is used only by the standalone Sphera app; the main web
 * app authenticates through the Supabase exchange. Both mint the same tokens.
 *
 * @status ACTIVE  auth/register/ auth/login/ auth/logout/ auth/me/
 * @status ACTIVE  auth/change-password/ auth/change-email/ auth/delete-account/
 * @status ACTIVE  check-availability/ profile/ search/ by-username/<username>/ <id>/
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Prisma, type ProfileVisibility, type Connection } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { decoyHash, hashPassword, verifyPassword } from "../lib/password.js";
import { issueTokenPair, verifyToken } from "../lib/jwt.js";
import { loadUserCounts } from "../lib/userCounts.js";
import { serializeUser, serializeUserSummary, userSelect, type SerializableUser } from "../serializers/user.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, conflict, forbidden, notFound, unauthenticated } from "../lib/errors.js";
import { currentUser, requireAdmin, requireAuth } from "../middleware/auth.js";
import { clientIp, rateLimit, RATE_LIMITS } from "../middleware/rateLimit.js";
import { reset as resetRateLimit } from "../lib/rateLimit.js";
import { singleUpload } from "../middleware/upload.js";
import { storage } from "../services/storage.js";
import { analyseStudentCard } from "../services/verification.js";
import { notifyConnectionAccepted, notifyConnectionRequested, notifyVerificationStatus } from "../services/notifications.js";
import { passwordReset, supabaseCompleteProfile, supabaseExchange } from "./supabaseAuth.js";

// ── Auth throttles ──────────────────────────────────────────────────────────
// Two buckets on login, for the reason set out in middleware/rateLimit.ts: an
// IP-only limit strict enough to stop brute force would lock out a whole campus
// sharing one NAT address.

const LOGIN_ACCOUNT_SCOPE = "login-account";

const loginAccountRateLimit = rateLimit({
  scope: LOGIN_ACCOUNT_SCOPE,
  ...RATE_LIMITS.loginPerAccount,
  // Unparseable bodies fall through to the schema's 400 rather than being counted.
  key: (req) => normaliseEmail(String((req.body as { email?: unknown } | undefined)?.email ?? "unknown")),
});

const loginIpRateLimit = rateLimit({ scope: "login-ip", ...RATE_LIMITS.loginPerIp, key: clientIp });

const registrationRateLimit = rateLimit({ scope: "register", ...RATE_LIMITS.registration, key: clientIp });

// ── Connection helpers ──────────────────────────────────────────────────────

type ConnectionWithUsers = Connection & { requester: SerializableUser; recipient: SerializableUser };

function serializeConnection(c: ConnectionWithUsers, viewerId: number): Record<string, unknown> {
  return {
    id: c.id,
    requester: c.requesterId,
    recipient: c.recipientId,
    status: c.status.toLowerCase(),
    requester_info: serializeUser(c.requester, { viewerId }),
    recipient_info: serializeUser(c.recipient, { viewerId }),
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  };
}

/** Any connection between two users, in either direction and any status. */
async function findRelation(a: number, b: number): Promise<ConnectionWithUsers | null> {
  return prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: a, recipientId: b },
        { requesterId: b, recipientId: a },
      ],
    },
    include: { requester: { select: userSelect }, recipient: { select: userSelect } },
  });
}

/**
 * Shared by POST /<id>/connections/ and POST /<id>/connection-relation/, which the
 * two frontends use interchangeably for the same action.
 */
async function createConnectionRequest(req: Request, res: Response, targetId: number): Promise<void> {
  const me = currentUser(req);

  if (targetId === me.id) throw badRequest("Cannot connect to yourself.");

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw notFound("User not found.");

  const existing = await findRelation(me.id, targetId);
  if (existing) {
    // Idempotent rather than a 409: both clients treat this as "already requested".
    ok(res, serializeConnection(existing, me.id), "Connection already exists.");
    return;
  }

  const connection = await prisma.connection.create({
    data: { requesterId: me.id, recipientId: targetId, status: "PENDING" },
    include: { requester: { select: userSelect }, recipient: { select: userSelect } },
  });

  await notifyConnectionRequested(
    { id: me.id, username: me.username, firstName: connection.requester.firstName, lastName: connection.requester.lastName, avatar: connection.requester.avatar },
    targetId,
    connection.id,
  );

  created(res, serializeConnection(connection, me.id), "Connection created successfully.");
}

export const usersRouter: Router = Router();

const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

const normaliseEmail = (v: string) => v.trim().toLowerCase();
const normaliseUsername = (v: string) => v.trim();

// ── Registration ────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    username: z.string().min(3).max(50).regex(USERNAME_RE, "Username may contain letters, digits, dots, dashes and underscores."),
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string(),
    university: z.string().max(100).optional(),
    faculty: z.string().max(100).optional(),
    study_year: z.string().max(20).optional(),
    student_id: z.string().max(50).optional(),
    campus: z.string().max(100).optional(),
    town: z.string().max(100).optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

usersRouter.post("/auth/register/", registrationRateLimit, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const email = normaliseEmail(input.email);
  const username = normaliseUsername(input.username);

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email: { equals: email, mode: "insensitive" } }, { username: { equals: username, mode: "insensitive" } }] },
    select: { email: true, username: true },
  });
  if (clash) {
    const fieldErrors: Record<string, string[]> = {};
    if (clash.email.toLowerCase() === email) fieldErrors.email = ["This email is already in use."];
    if (clash.username.toLowerCase() === username.toLowerCase()) fieldErrors.username = ["This username is already in use."];
    throw conflict("Account already exists.", fieldErrors);
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      firstName: input.first_name,
      lastName: input.last_name,
      passwordHash: await hashPassword(input.password),
      university: input.university ?? "",
      faculty: input.faculty ?? "",
      studyYear: input.study_year ?? "",
      studentId: input.student_id ?? "",
      campus: input.campus ?? "",
      town: input.town ?? "",
    },
    select: userSelect,
  });

  created(
    res,
    {
      user: serializeUser(user, { viewerId: user.id, counts: await loadUserCounts(user.id) }),
      tokens: issueTokenPair(user.id),
    },
    "User registered successfully.",
  );
});

// ── Login / logout ──────────────────────────────────────────────────────────

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

usersRouter.post("/auth/login/", loginIpRateLimit, loginAccountRateLimit, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const email = normaliseEmail(input.email);

  const record = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { ...userSelect, passwordHash: true, isActive: true },
  });

  // Always perform a verification, against a decoy hash when the account is absent,
  // so response timing does not reveal whether an email is registered.
  const valid = await verifyPassword(input.password, record?.passwordHash ?? (await decoyHash()));
  if (!record || !valid) throw unauthenticated("Invalid credentials.");
  if (!record.isActive) throw unauthenticated("This account is disabled.");

  // Forgive the per-account counter once the caller proves they own the account,
  // so someone else's failed attempts against the same email cannot lock out the
  // real owner for the rest of the window.
  await resetRateLimit(`${LOGIN_ACCOUNT_SCOPE}:${email}`);

  const { passwordHash: _passwordHash, isActive: _isActive, ...user } = record;

  ok(
    res,
    {
      user: serializeUser(user, { viewerId: user.id, counts: await loadUserCounts(user.id) }),
      tokens: issueTokenPair(user.id),
    },
    "Login successful.",
  );
});

const logoutSchema = z.object({ refresh: z.string().optional() });

usersRouter.post("/auth/logout/", requireAuth, async (req, res) => {
  const { refresh } = logoutSchema.parse(req.body ?? {});
  const me = currentUser(req);

  if (refresh) {
    try {
      const claims = verifyToken(refresh, "refresh");
      if (claims.user_id === me.id) {
        // Genuine revocation, unlike Django's silently no-opping blacklist call.
        await prisma.revokedToken.upsert({
          where: { jti: claims.jti },
          create: { jti: claims.jti, userId: me.id, expiresAt: new Date(claims.exp * 1000) },
          update: {},
        });
      }
    } catch {
      // An already-invalid token needs no revocation; logout still succeeds.
    }
  }

  ok(res, null, "Logout successful.");
});

// ── Supabase duplicates (DEPRECATED) ────────────────────────────────────────
// Superseded by the /api/auth/supabase/* paths, which is what both clients call.
// Retained per the migration policy and made to behave identically: the Django
// original referenced an undefined SUPABASE_ANON_KEY and 500'd on every request.

/** @status DEPRECATED — duplicate of POST /api/auth/supabase/exchange/ */
usersRouter.post("/auth/supabase/exchange-token/", supabaseExchange);

/** @status DEPRECATED — duplicate of POST /api/auth/supabase/complete-profile/ */
usersRouter.post("/auth/supabase/complete-profile/", requireAuth, supabaseCompleteProfile);

/** @status DEPRECATED — Supabase owns password reset; the client calls it directly */
usersRouter.post("/auth/password-reset/", registrationRateLimit, passwordReset);

// ── Current user ────────────────────────────────────────────────────────────

usersRouter.get("/auth/me/", async (req, res) => {
  // Dual-mode by contract: anonymous callers get authenticated:false, not a 401.
  if (!req.user) {
    res.status(200).json({ success: true, authenticated: false, data: null, timestamp: new Date().toISOString() });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: userSelect });
  if (!user) throw unauthenticated("Account no longer exists.");

  res.status(200).json({
    success: true,
    authenticated: true,
    data: serializeUser(user, { viewerId: user.id, counts: await loadUserCounts(user.id) }),
    timestamp: new Date().toISOString(),
  });
});

// ── Credentials ─────────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

usersRouter.post("/auth/change-password/", requireAuth, async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  const me = currentUser(req);

  const record = await prisma.user.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (!(await verifyPassword(input.current_password, record?.passwordHash ?? null))) {
    throw badRequest("Current password is incorrect.", { current_password: ["Current password is incorrect."] });
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash: await hashPassword(input.new_password) },
  });
  ok(res, null, "Password updated successfully.");
});

const changeEmailSchema = z.object({ current_email: z.string().email(), new_email: z.string().email() });

usersRouter.post("/auth/change-email/", requireAuth, async (req, res) => {
  const input = changeEmailSchema.parse(req.body);
  const me = currentUser(req);
  const newEmail = normaliseEmail(input.new_email);

  if (normaliseEmail(input.current_email) !== me.email.toLowerCase()) {
    throw badRequest("Current email does not match your account.", {
      current_email: ["Current email does not match your account."],
    });
  }
  if (newEmail === me.email.toLowerCase()) {
    throw badRequest("New email must be different.", { new_email: ["New email must be different."] });
  }

  const taken = await prisma.user.findFirst({
    where: { email: { equals: newEmail, mode: "insensitive" }, id: { not: me.id } },
    select: { id: true },
  });
  if (taken) throw conflict("This email is already in use.", { new_email: ["This email is already in use."] });

  const user = await prisma.user.update({ where: { id: me.id }, data: { email: newEmail }, select: userSelect });
  ok(res, serializeUser(user, { viewerId: me.id, counts: await loadUserCounts(me.id) }), "Email updated successfully.");
});

const deleteAccountSchema = z.object({ confirmation_text: z.string() });

usersRouter.delete("/auth/delete-account/", requireAuth, async (req, res) => {
  const input = deleteAccountSchema.parse(req.body ?? {});
  if (input.confirmation_text.trim().toUpperCase() !== "SUPPRIMER") {
    throw badRequest("Type SUPPRIMER to confirm account deletion.", {
      confirmation_text: ["Type SUPPRIMER to confirm account deletion."],
    });
  }

  await prisma.user.delete({ where: { id: currentUser(req).id } });
  ok(res, null, "Account deleted successfully.");
});

// ── Availability ────────────────────────────────────────────────────────────

const availabilitySchema = z.object({
  username: z.string().optional(),
  email: z.string().optional(),
});

usersRouter.post("/check-availability/", async (req, res) => {
  const input = availabilitySchema.parse(req.body ?? {});
  const username = input.username?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!username && !email) throw badRequest("Provide a username and/or email to check.");

  const data: Record<string, unknown> = {};

  if (username) {
    const taken = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });
    // Nested shape is what the client actually reads (`data.username.available`);
    // Django returned only the flat key, so the check always reported "available".
    data.username = { value: username, available: !taken };
    data.username_available = !taken;
  }

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    data.email = { value: email, available: !taken };
    data.email_available = !taken;
  }

  ok(res, data);
});

// ── Profile ─────────────────────────────────────────────────────────────────

const profileUpdateSchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  username: z.string().min(3).max(50).regex(USERNAME_RE).optional(),
  bio: z.string().optional(),
  university: z.string().max(100).optional(),
  faculty: z.string().max(100).optional(),
  study_year: z.string().max(20).optional(),
  student_id: z.string().max(50).optional(),
  campus: z.string().max(100).optional(),
  town: z.string().max(100).optional(),
  language: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  current_mood: z.string().max(100).optional(),
  previous_education: z.array(z.record(z.unknown())).optional(),
  experiences: z.array(z.record(z.unknown())).optional(),
  portfolio_links: z.array(z.record(z.unknown())).optional(),
  phone_number: z.string().max(30).optional(),
  date_of_birth: z.string().optional().nullable(),
});

usersRouter.get("/profile/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: userSelect });
  ok(res, serializeUser(user, { viewerId: me.id, counts: await loadUserCounts(me.id) }));
});

/**
 * Profile update.
 *
 * PUT and PATCH share one handler: every field on the schema is optional, so the
 * two are already identical in effect, and DRF's `RetrieveUpdateAPIView` accepted
 * both. `api.ts` sends PATCH, but the inventory records PUT as live too, and a
 * missing PUT is a 404 rather than a 405 — an error the caller cannot interpret.
 */
async function updateProfile(req: Request, res: Response): Promise<void> {
  const input = profileUpdateSchema.parse(req.body ?? {});
  const me = currentUser(req);

  if (input.username) {
    const taken = await prisma.user.findFirst({
      where: { username: { equals: input.username.trim(), mode: "insensitive" }, id: { not: me.id } },
      select: { id: true },
    });
    if (taken) throw conflict("This username is already in use.", { username: ["This username is already in use."] });
  }

  const data: Prisma.UserUpdateInput = {};
  if (input.first_name !== undefined) data.firstName = input.first_name;
  if (input.last_name !== undefined) data.lastName = input.last_name;
  if (input.username !== undefined) data.username = input.username.trim();
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.university !== undefined) data.university = input.university;
  if (input.faculty !== undefined) data.faculty = input.faculty;
  if (input.study_year !== undefined) data.studyYear = input.study_year;
  if (input.student_id !== undefined) data.studentId = input.student_id;
  if (input.campus !== undefined) data.campus = input.campus;
  if (input.town !== undefined) data.town = input.town;
  if (input.current_mood !== undefined) data.currentMood = input.current_mood;
  if (input.phone_number !== undefined) data.phoneNumber = input.phone_number;
  if (input.language !== undefined) data.language = input.language;
  if (input.skills !== undefined) data.skills = input.skills;
  if (input.interests !== undefined) data.interests = input.interests;
  if (input.previous_education !== undefined) data.previousEducation = input.previous_education as Prisma.InputJsonValue;
  if (input.experiences !== undefined) data.experiences = input.experiences as Prisma.InputJsonValue;
  if (input.portfolio_links !== undefined) data.portfolioLinks = input.portfolio_links as Prisma.InputJsonValue;

  if (input.date_of_birth !== undefined) {
    // Accept the several formats the client has historically sent; an unparseable
    // value clears the field rather than rejecting the whole update.
    data.dateOfBirth = parseDate(input.date_of_birth);
  }

  const user = await prisma.user.update({ where: { id: me.id }, data, select: userSelect });
  ok(res, serializeUser(user, { viewerId: me.id, counts: await loadUserCounts(me.id) }), "Profile updated successfully.");
}

usersRouter.patch("/profile/", requireAuth, updateProfile);
usersRouter.put("/profile/", requireAuth, updateProfile);

function parseDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const raw = value.trim();

  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const parsed = dmy ? new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`) : new Date(raw);

  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) return null;
  return parsed;
}

// ── Lookup ──────────────────────────────────────────────────────────────────

usersRouter.get("/search/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const q = String(req.query.q ?? "").trim();
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.UserWhereInput = {
    isActive: true,
    id: { not: me.id },
    ...(q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { username: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: userSelect, skip, take: pageSize, orderBy: { dateJoined: "desc" } }),
  ]);

  list(res, users.map(serializeUserSummary), paginate(total, page, pageSize));
});

usersRouter.get("/by-username/:username/", async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { username: { equals: req.params.username, mode: "insensitive" } },
    select: userSelect,
  });
  if (!user) throw notFound("User not found.");

  ok(res, serializeUser(user, { viewerId: req.user?.id ?? null, counts: await loadUserCounts(user.id) }));
});

// ── Privacy ─────────────────────────────────────────────────────────────────

const VISIBILITY_VALUES = ["public", "connections", "private"] as const;
const toVisibility = (v: (typeof VISIBILITY_VALUES)[number]) => v.toUpperCase() as ProfileVisibility;

const privacySchema = z.object({
  profile_visibility: z.enum(VISIBILITY_VALUES).optional(),
  post_visibility: z.enum(VISIBILITY_VALUES).optional(),
});

function serializePrivacy(u: { profileVisibility: ProfileVisibility; postVisibility: ProfileVisibility; dataExportRequestedAt: Date | null }) {
  return {
    profile_visibility: u.profileVisibility.toLowerCase(),
    post_visibility: u.postVisibility.toLowerCase(),
    data_export_requested_at: u.dataExportRequestedAt?.toISOString() ?? null,
  };
}

const privacySelect = { profileVisibility: true, postVisibility: true, dataExportRequestedAt: true } as const;

usersRouter.get("/privacy/", requireAuth, async (req, res) => {
  const me = await prisma.user.findUniqueOrThrow({ where: { id: currentUser(req).id }, select: privacySelect });
  ok(res, serializePrivacy(me));
});

usersRouter.put("/privacy/", requireAuth, async (req, res) => {
  const input = privacySchema.parse(req.body ?? {});
  const data: Prisma.UserUpdateInput = {};
  if (input.profile_visibility) data.profileVisibility = toVisibility(input.profile_visibility);
  if (input.post_visibility) data.postVisibility = toVisibility(input.post_visibility);

  const me = await prisma.user.update({ where: { id: currentUser(req).id }, data, select: privacySelect });
  ok(res, serializePrivacy(me), "Privacy settings updated successfully.");
});

// ── Data export ─────────────────────────────────────────────────────────────

const dataExportSchema = z.object({
  include_connections: z.boolean().default(true),
  include_posts: z.boolean().default(true),
});

usersRouter.post("/data-export/", requireAuth, async (req, res) => {
  const input = dataExportSchema.parse(req.body ?? {});
  const me = currentUser(req);

  const user = await prisma.user.update({
    where: { id: me.id },
    data: { dataExportRequestedAt: new Date() },
    select: userSelect,
  });

  const connections = input.include_connections
    ? await prisma.connection.findMany({
        where: { status: "ACCEPTED", OR: [{ requesterId: me.id }, { recipientId: me.id }] },
        include: { requester: { select: userSelect }, recipient: { select: userSelect } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const posts = input.include_posts
    ? await prisma.post.findMany({
        where: { authorId: me.id },
        select: { id: true, content: true, visibility: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  ok(
    res,
    {
      profile: serializeUser(user, { viewerId: me.id, counts: await loadUserCounts(me.id) }),
      connections: connections.map((c) => serializeConnection(c, me.id)),
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        visibility: p.visibility.toLowerCase(),
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      })),
      metadata: {
        generated_at: new Date().toISOString(),
        include_connections: input.include_connections,
        include_posts: input.include_posts,
      },
    },
    "Data export generated successfully.",
  );
});

// ── Blocks ──────────────────────────────────────────────────────────────────

const blockCreateSchema = z.object({ blocked_user_id: z.number().int().positive() });

usersRouter.get("/blocks/", requireAuth, async (req, res) => {
  const blocks = await prisma.userBlock.findMany({
    where: { blockerId: currentUser(req).id },
    include: { blocked: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });

  list(
    res,
    blocks.map((b) => ({
      id: b.id,
      blocked: b.blockedId,
      blocked_user: serializeUserSummary(b.blocked),
      created_at: b.createdAt.toISOString(),
    })),
  );
});

usersRouter.post("/blocks/", requireAuth, async (req, res) => {
  const { blocked_user_id: blockedId } = blockCreateSchema.parse(req.body);
  const me = currentUser(req);

  if (blockedId === me.id) throw badRequest("You cannot block yourself.");
  const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) throw badRequest("User does not exist.", { blocked_user_id: ["User does not exist."] });

  const existing = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId } },
    include: { blocked: { select: userSelect } },
  });
  if (existing) {
    ok(res, { id: existing.id, blocked: blockedId, blocked_user: serializeUserSummary(existing.blocked) }, "User already blocked.");
    return;
  }

  const block = await prisma.userBlock.create({
    data: { blockerId: me.id, blockedId },
    include: { blocked: { select: userSelect } },
  });
  created(
    res,
    { id: block.id, blocked: blockedId, blocked_user: serializeUserSummary(block.blocked), created_at: block.createdAt.toISOString() },
    "User blocked successfully.",
  );
});

usersRouter.delete("/blocks/:id/", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const block = await prisma.userBlock.findFirst({ where: { id, blockerId: currentUser(req).id } });
  if (!block) throw notFound("Block not found.");

  await prisma.userBlock.delete({ where: { id } });
  ok(res, null, "User unblocked successfully.");
});

// ── Student verification ────────────────────────────────────────────────────

/**
 * POST /api/users/me/verify/ — multipart: `student_id` + `card_image`.
 *
 * The submission is persisted **before** the model is consulted, and the response
 * is the same shape whether or not the model ran. That ordering is deliberate: a
 * slow or failing vision API must never cost a student their submission, and an
 * unverified-but-recorded card can still be approved by an admin from the
 * verification queue.
 */
usersRouter.post("/me/verify/", requireAuth, singleUpload("card_image", "avatar"), async (req, res) => {
  const me = currentUser(req);
  const studentId = String((req.body as { student_id?: unknown })?.student_id ?? "").trim();
  const card = req.file;

  if (!studentId || !card) {
    throw badRequest("student_id and card_image are required", {
      ...(studentId ? {} : { student_id: ["This field is required."] }),
      ...(card ? {} : { card_image: ["This field is required."] }),
    });
  }

  const stored = await storage.put({
    buffer: card.buffer,
    originalName: card.originalname,
    contentType: card.mimetype,
    prefix: "student-cards",
  });

  const user = await prisma.user.update({
    where: { id: me.id },
    data: { studentId, cardImage: stored.url },
    select: { ...userSelect, isVerified: true, university: true },
  });

  const analysis = await analyseStudentCard(
    card.buffer,
    card.mimetype,
    `${user.firstName} ${user.lastName}`.trim() || user.username,
    user.university,
  );

  if (analysis.verified && !user.isVerified) {
    await prisma.user.update({ where: { id: me.id }, data: { isVerified: true } });
    await notifyVerificationStatus(me.id, true);
  }

  ok(res, {
    success: true,
    verified: analysis.verified,
    message: analysis.verified
      ? "Profil mis à jour et certifié par l'IA ! 🎉"
      : "Tes informations ont été enregistrées. La certification est en cours de traitement.",
  });
});

// ── Contact ─────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  subject: z.string().min(1).max(255),
  message: z.string().min(1),
  newsletter: z.boolean().default(false),
});

usersRouter.post("/contact/", async (req, res) => {
  const input = contactSchema.parse(req.body);
  const record = await prisma.contactMessage.create({
    data: { ...input, email: normaliseEmail(input.email) },
    select: { id: true, createdAt: true },
  });
  created(res, { id: record.id, created_at: record.createdAt.toISOString() }, "Message sent successfully.");
});

usersRouter.get("/admin/contact-messages/", requireAuth, requireAdmin, async (req, res) => {
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);
  const search = String(req.query.search ?? "").trim();

  const where: Prisma.ContactMessageWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
  ]);

  list(
    res,
    messages.map((m) => ({ ...m, created_at: m.createdAt.toISOString(), is_read: m.isRead })),
    paginate(total, page, pageSize),
  );
});

usersRouter.get("/admin/contact-messages/:id/", requireAuth, requireAdmin, async (req, res) => {
  const message = await prisma.contactMessage.findUnique({ where: { id: Number(req.params.id) } });
  if (!message) throw notFound("Message not found.");
  ok(res, { ...message, created_at: message.createdAt.toISOString(), is_read: message.isRead });
});

usersRouter.patch("/admin/contact-messages/:id/", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const input = z.object({ is_read: z.boolean().optional() }).parse(req.body ?? {});

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw notFound("Message not found.");

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { ...(input.is_read !== undefined ? { isRead: input.is_read } : {}) },
  });
  ok(res, { ...updated, created_at: updated.createdAt.toISOString(), is_read: updated.isRead });
});

usersRouter.delete("/admin/contact-messages/:id/", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) throw notFound("Message not found.");

  await prisma.contactMessage.delete({ where: { id } });
  ok(res, null, "Message deleted.");
});

// ── Connections ─────────────────────────────────────────────────────────────

usersRouter.get("/:id/connections/", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const me = currentUser(req);

  if (targetId !== me.id && env.connectionListVisibility !== "public_profile") {
    throw forbidden("Not authorized to view this user's connections.");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw notFound("User not found.");

  const connections = await prisma.connection.findMany({
    where: { OR: [{ requesterId: targetId }, { recipientId: targetId }] },
    include: { requester: { select: userSelect }, recipient: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });

  list(res, connections.map((c) => serializeConnection(c, me.id)));
});

usersRouter.post("/:id/connections/", requireAuth, async (req, res) => {
  await createConnectionRequest(req, res, Number(req.params.id));
});

usersRouter.delete("/:id/connections/:connectionId/", requireAuth, async (req, res) => {
  const connectionId = Number(req.params.connectionId);
  const me = currentUser(req);

  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) throw notFound("Connection not found.");
  if (connection.requesterId !== me.id && connection.recipientId !== me.id) {
    throw forbidden("Not authorized to delete this connection.");
  }

  await prisma.connection.delete({ where: { id: connectionId } });
  res.status(204).send();
});

usersRouter.get("/:id/connection-relation/", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const me = currentUser(req);

  if (targetId === me.id) {
    ok(res, {
      target_user_id: targetId,
      is_self: true,
      is_connected: false,
      can_connect: false,
      can_disconnect: false,
      connection: null,
    });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw notFound("User not found.");

  const connection = await findRelation(me.id, targetId);

  // `is_connected` is true for a PENDING request too. That mirrors the behaviour
  // the client's button states already depend on; narrowing it to ACCEPTED would
  // make a pending request render as "connect" and allow a duplicate.
  ok(res, {
    target_user_id: targetId,
    is_self: false,
    is_connected: connection !== null,
    can_connect: connection === null,
    can_disconnect: connection !== null,
    connection: connection ? serializeConnection(connection, me.id) : null,
  });
});

usersRouter.post("/:id/connection-relation/", requireAuth, async (req, res) => {
  await createConnectionRequest(req, res, Number(req.params.id));
});

usersRouter.patch("/:id/connection-relation/", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const me = currentUser(req);

  const connection = await findRelation(me.id, targetId);
  if (!connection) throw notFound("Connection not found.");
  if (connection.recipientId !== me.id) throw forbidden("Only the recipient can accept the connection request.");
  if (connection.status === "ACCEPTED") throw badRequest("Connection is already accepted.");

  const updated = await prisma.connection.update({
    where: { id: connection.id },
    data: { status: "ACCEPTED" },
    include: { requester: { select: userSelect }, recipient: { select: userSelect } },
  });

  const accepter = await prisma.user.findUniqueOrThrow({
    where: { id: me.id },
    select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
  });
  await notifyConnectionAccepted(accepter, updated.requesterId, updated.id);

  ok(res, serializeConnection(updated, me.id), "Connection accepted successfully.");
});

usersRouter.delete("/:id/connection-relation/", requireAuth, async (req, res) => {
  const targetId = Number(req.params.id);
  const me = currentUser(req);

  if (targetId === me.id) throw badRequest("Cannot disconnect from yourself.");

  const connection = await findRelation(me.id, targetId);
  if (!connection) throw notFound("Connection not found.");

  await prisma.connection.delete({ where: { id: connection.id } });
  res.status(204).send();
});

// Registered last so the literal routes above (profile/, search/, auth/…) win.
// Express 5 uses path-to-regexp v8, which removed inline regex params, so the
// numeric constraint is enforced here rather than in the path.
usersRouter.get("/:id/", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound("User not found.");

  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw notFound("User not found.");

  ok(res, serializeUser(user, { viewerId: req.user?.id ?? null, counts: await loadUserCounts(user.id) }));
});
