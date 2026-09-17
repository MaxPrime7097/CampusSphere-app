/**
 * Spheres — mounted at /api/spheres/. API_CONTRACT §3.3.
 *
 * @status ACTIVE   / <id>/ <id>/join/ <id>/leave/ <id>/cancel-request/
 * @status ACTIVE   <id>/extend-duration/ <id>/members/ <id>/members/<mid>/
 * @status ACTIVE   <id>/overview/ <id>/files/ <id>/files/<fid>/ user/spheres/
 * @status UNUSED   <id>/features/ — the client mirrors this table locally
 *
 * @status ACTIVE   <id>/banner/ <id>/files/ (POST) — multipart, object storage
 */

import { Router, type Request } from "express";
import { z } from "zod";
import { Prisma, SphereCategory, SphereType, type SphereMemberStatus, type SphereRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { computeExpiry, getSphereFeatures } from "../lib/sphereConfig.js";
import { resolveSphereId } from "../lib/sphereLookup.js";
import { serializeSphere, serializeSphereMember, sphereInclude } from "../serializers/sphere.js";
import { userSelect } from "../serializers/user.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { singleUpload } from "../middleware/upload.js";
import { keyFromUrl, storage } from "../services/storage.js";

export const spheresRouter: Router = Router();
spheresRouter.use(requireAuth);

const CATEGORIES = ["academic", "professional", "social", "sports", "arts", "technology", "other"] as const;
const TYPES = ["cours", "projet", "club", "revision", "communaute"] as const;

const toCategory = (v: string) => v.toUpperCase() as SphereCategory;
const toType = (v: string) => v.toUpperCase() as SphereType;

/** Excludes spheres whose expiry has passed. */
const notExpired: Prisma.SphereWhereInput = {
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
};

async function membershipOf(sphereId: number, userId: number) {
  return prisma.sphereMember.findUnique({
    where: { sphereId_userId: { sphereId, userId } },
    select: { id: true, role: true, status: true },
  });
}

async function taskCountsFor(sphereId: number) {
  const [total, completed] = await Promise.all([
    prisma.task.count({ where: { sphereId } }),
    prisma.task.count({ where: { sphereId, isCompleted: true } }),
  ]);
  return { total, completed };
}

/** Recompute the denormalised active-member count. */
async function syncMemberCount(sphereId: number): Promise<void> {
  const memberCount = await prisma.sphereMember.count({ where: { sphereId, status: "ACTIVE" } });
  await prisma.sphere.update({ where: { id: sphereId }, data: { memberCount } });
}

async function sphereIdOf(req: Request): Promise<number> {
  return resolveSphereId(req.params.id);
}

// ── List / create ───────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().default(""),
  category: z.enum(CATEGORIES).default("other"),
  sphere_type: z.enum(TYPES).default("communaute"),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  is_private: z.boolean().default(false),
  require_approval: z.boolean().default(false),
  objective: z.string().default(""),
  target_audience: z.string().max(200).default(""),
  duration: z.string().max(50).default("permanent"),
  auto_delete_on_expiry: z.boolean().default(false),
  collaboration_types: z.array(z.string()).default([]),
});

spheresRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);
  const search = String(req.query.search ?? "").trim();
  const mineOnly = String(req.query.my_spheres ?? "").toLowerCase() === "true";

  // [CHANGE] Django ignored unknown query params, so the three client call sites
  // passing my_spheres=true were listing every sphere on the platform.
  const visibility: Prisma.SphereWhereInput = mineOnly
    ? { members: { some: { userId: me.id, status: "ACTIVE" } } }
    : { OR: [{ isPrivate: false }, { members: { some: { userId: me.id, status: "ACTIVE" } } }] };

  const where: Prisma.SphereWhereInput = {
    AND: [
      notExpired,
      visibility,
      ...(search
        ? [{ OR: [{ name: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] }]
        : []),
    ],
  };

  const [total, spheres] = await Promise.all([
    prisma.sphere.count({ where }),
    prisma.sphere.findMany({ where, include: sphereInclude, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
  ]);

  const memberships = await prisma.sphereMember.findMany({
    where: { userId: me.id, sphereId: { in: spheres.map((s) => s.id) } },
    select: { sphereId: true, role: true, status: true },
  });
  const byId = new Map(memberships.map((m) => [m.sphereId, m]));

  list(
    res,
    spheres.map((s) => serializeSphere(s, { viewerId: me.id, membership: byId.get(s.id) ?? null })),
    paginate(total, page, pageSize),
  );
});

spheresRouter.post("/", async (req, res) => {
  const input = createSchema.parse(req.body ?? {});
  const me = currentUser(req);

  const sphere = await prisma.sphere.create({
    data: {
      name: input.name,
      description: input.description,
      category: toCategory(input.category),
      sphereType: toType(input.sphere_type),
      ...(input.color ? { color: input.color } : {}),
      ...(input.icon ? { icon: input.icon } : {}),
      isPrivate: input.is_private,
      requireApproval: input.require_approval,
      objective: input.objective,
      targetAudience: input.target_audience,
      duration: input.duration,
      expiresAt: computeExpiry(input.duration),
      autoDeleteOnExpiry: input.auto_delete_on_expiry,
      collaborationTypes: input.collaboration_types,
      createdById: me.id,
      // The creator is an active admin from the outset, and memberCount reflects it
      // immediately — both written in one transaction so a sphere is never briefly
      // memberless.
      memberCount: 1,
      members: { create: { userId: me.id, role: "ADMIN", status: "ACTIVE" } },
    },
    include: sphereInclude,
  });

  created(res, serializeSphere(sphere, { viewerId: me.id, membership: { role: "ADMIN", status: "ACTIVE" } }));
});

// ── Convenience listings (before /:id/ so they are not shadowed) ─────────────

spheresRouter.get("/user/spheres/", async (req, res) => {
  const me = currentUser(req);
  const memberships = await prisma.sphereMember.findMany({
    where: { userId: me.id, status: "ACTIVE", sphere: notExpired },
    include: { sphere: { include: sphereInclude } },
    orderBy: { joinedAt: "desc" },
  });

  list(
    res,
    memberships.map((m) =>
      serializeSphere(m.sphere, { viewerId: me.id, membership: { role: m.role, status: m.status } }),
    ),
  );
});

// ── Detail ──────────────────────────────────────────────────────────────────

const updateSchema = createSchema.partial();

async function loadVisibleSphere(req: Request) {
  const id = await sphereIdOf(req);
  const me = currentUser(req);

  const sphere = await prisma.sphere.findUnique({ where: { id }, include: sphereInclude });
  if (!sphere) throw notFound("Sphere not found.");

  const membership = await membershipOf(id, me.id);

  // A private sphere is invisible to non-members. 404 rather than 403 so its
  // existence is not disclosed — API_CONTRACT §1.4.
  if (sphere.isPrivate && sphere.createdById !== me.id && membership?.status !== "ACTIVE") {
    throw notFound("Sphere not found.");
  }

  return { sphere, membership, me };
}

spheresRouter.get("/:id/", async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);
  ok(res, serializeSphere(sphere, { viewerId: me.id, membership, taskCounts: await taskCountsFor(sphere.id) }));
});

async function applyUpdate(req: Request, res: import("express").Response) {
  const { sphere, me } = await loadVisibleSphere(req);
  if (sphere.createdById !== me.id) throw forbidden("Only the sphere creator can modify or delete this sphere.");

  const input = updateSchema.parse(req.body ?? {});
  const data: Prisma.SphereUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.category !== undefined) data.category = toCategory(input.category);
  if (input.sphere_type !== undefined) data.sphereType = toType(input.sphere_type);
  if (input.color !== undefined) data.color = input.color;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.is_private !== undefined) data.isPrivate = input.is_private;
  if (input.require_approval !== undefined) data.requireApproval = input.require_approval;
  if (input.objective !== undefined) data.objective = input.objective;
  if (input.target_audience !== undefined) data.targetAudience = input.target_audience;
  if (input.auto_delete_on_expiry !== undefined) data.autoDeleteOnExpiry = input.auto_delete_on_expiry;
  if (input.collaboration_types !== undefined) data.collaborationTypes = input.collaboration_types;
  if (input.duration !== undefined) {
    data.duration = input.duration;
    data.expiresAt = computeExpiry(input.duration);
  }

  const updated = await prisma.sphere.update({ where: { id: sphere.id }, data, include: sphereInclude });
  ok(res, serializeSphere(updated, { viewerId: me.id, membership: { role: "ADMIN", status: "ACTIVE" } }));
}

spheresRouter.put("/:id/", applyUpdate);
spheresRouter.patch("/:id/", applyUpdate);

spheresRouter.delete("/:id/", async (req, res) => {
  const { sphere, me } = await loadVisibleSphere(req);
  if (sphere.createdById !== me.id) throw forbidden("Only the sphere creator can modify or delete this sphere.");

  await prisma.sphere.delete({ where: { id: sphere.id } });
  res.status(204).send();
});

spheresRouter.get("/:id/features/", async (req, res) => {
  const { sphere } = await loadVisibleSphere(req);
  ok(res, getSphereFeatures(sphere.sphereType));
});

// ── Membership ──────────────────────────────────────────────────────────────

spheresRouter.post("/:id/join/", async (req, res) => {
  const id = await sphereIdOf(req);
  const me = currentUser(req);

  const sphere = await prisma.sphere.findFirst({ where: { id, AND: notExpired } });
  if (!sphere) throw notFound("Sphere not found.");

  const existing = await membershipOf(id, me.id);
  if (existing && (existing.status === "ACTIVE" || existing.status === "PENDING")) {
    throw conflict(
      existing.status === "ACTIVE"
        ? "You already have an active membership for this sphere."
        : "You already have a pending request to join this sphere.",
    );
  }

  const status: SphereMemberStatus = sphere.requireApproval ? "PENDING" : "ACTIVE";

  await prisma.sphereMember.upsert({
    where: { sphereId_userId: { sphereId: id, userId: me.id } },
    create: { sphereId: id, userId: me.id, role: "MEMBER", status },
    update: { role: "MEMBER", status, joinedAt: new Date() },
  });
  await syncMemberCount(id);

  ok(res, {
    status: status.toLowerCase(),
    message: status === "ACTIVE" ? "Successfully joined the sphere" : "Join request sent for approval",
  });
});

spheresRouter.post("/:id/leave/", async (req, res) => {
  const id = await sphereIdOf(req);
  const me = currentUser(req);

  const membership = await prisma.sphereMember.findFirst({
    where: { sphereId: id, userId: me.id, status: "ACTIVE" },
  });
  if (!membership) throw notFound("You are not an active member of this sphere.");

  if (membership.role === "ADMIN") {
    const admins = await prisma.sphereMember.count({ where: { sphereId: id, role: "ADMIN", status: "ACTIVE" } });
    if (admins <= 1) throw badRequest("Cannot leave sphere as the only admin. Transfer admin rights first.");
  }

  await prisma.sphereMember.delete({ where: { id: membership.id } });
  await syncMemberCount(id);
  ok(res, null, "Successfully left the sphere.");
});

spheresRouter.delete("/:id/cancel-request/", async (req, res) => {
  const id = await sphereIdOf(req);
  const me = currentUser(req);

  const pending = await prisma.sphereMember.findFirst({ where: { sphereId: id, userId: me.id, status: "PENDING" } });
  if (!pending) throw notFound("No pending join request found for this sphere.");

  await prisma.sphereMember.delete({ where: { id: pending.id } });
  ok(res, null, "Join request cancelled successfully.");
});

const extendSchema = z.object({ duration: z.string().min(1) });

spheresRouter.post("/:id/extend-duration/", async (req, res) => {
  const { sphere, me } = await loadVisibleSphere(req);
  if (sphere.createdById !== me.id) throw forbidden("Only the sphere creator can extend the duration.");

  const { duration } = extendSchema.parse(req.body ?? {});
  // Extend from the current expiry when it is still in the future, so extending
  // twice adds up rather than resetting the clock.
  const base = sphere.expiresAt && sphere.expiresAt > new Date() ? sphere.expiresAt : new Date();
  const expiresAt = computeExpiry(duration, base);
  if (!expiresAt) throw badRequest("Unsupported duration. Use a finite duration to extend the sphere.");

  const updated = await prisma.sphere.update({
    where: { id: sphere.id },
    data: { duration, expiresAt },
    include: sphereInclude,
  });
  ok(res, serializeSphere(updated, { viewerId: me.id, membership: { role: "ADMIN", status: "ACTIVE" } }));
});

// ── Members ─────────────────────────────────────────────────────────────────

spheresRouter.get("/:id/members/", async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);
  if (membership?.status !== "ACTIVE" && sphere.createdById !== me.id) {
    throw forbidden("You must be a member of this sphere.");
  }

  const members = await prisma.sphereMember.findMany({
    where: { sphereId: sphere.id },
    include: { user: { select: userSelect } },
    orderBy: { joinedAt: "desc" },
  });

  list(res, members.map((m) => serializeSphereMember(m, me.id)));
});

const addMemberSchema = z.object({
  user: z.number().int().positive(),
  role: z.enum(["admin", "moderator", "member"]).default("member"),
});

spheresRouter.post("/:id/members/", async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);
  if (!membership || membership.status !== "ACTIVE" || !["ADMIN", "MODERATOR"].includes(membership.role)) {
    throw forbidden("Only sphere admins or moderators can add members.");
  }

  const input = addMemberSchema.parse(req.body ?? {});
  const existing = await membershipOf(sphere.id, input.user);
  if (existing?.status === "ACTIVE") throw conflict("User is already a member of this sphere.");

  const member = await prisma.sphereMember.upsert({
    where: { sphereId_userId: { sphereId: sphere.id, userId: input.user } },
    create: { sphereId: sphere.id, userId: input.user, role: input.role.toUpperCase() as SphereRole, status: "ACTIVE" },
    update: { role: input.role.toUpperCase() as SphereRole, status: "ACTIVE" },
    include: { user: { select: userSelect } },
  });
  await syncMemberCount(sphere.id);

  created(res, serializeSphereMember(member, me.id));
});

const updateMemberSchema = z.object({
  role: z.enum(["admin", "moderator", "member"]).optional(),
  status: z.enum(["active", "pending", "inactive", "banned"]).optional(),
});

spheresRouter.patch("/:id/members/:memberId/", async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);
  const actorIsAdmin = membership?.status === "ACTIVE" && membership.role === "ADMIN";
  const actorIsMod = membership?.status === "ACTIVE" && ["ADMIN", "MODERATOR"].includes(membership.role);

  if (!actorIsMod) throw forbidden("Only sphere admins or moderators can update members.");

  const input = updateMemberSchema.parse(req.body ?? {});
  if (Object.keys(input).length === 0) throw badRequest("Provide at least one field to update.");
  if (input.role && !actorIsAdmin) throw forbidden("Only sphere admins can change member roles.");

  const memberId = Number(req.params.memberId);
  if (!Number.isInteger(memberId) || memberId <= 0) throw notFound("Member not found.");

  const target = await prisma.sphereMember.findFirst({
    where: { id: memberId, sphereId: sphere.id },
  });
  if (!target) throw notFound("Member not found.");

  const nextRole = (input.role?.toUpperCase() as SphereRole | undefined) ?? target.role;
  const nextStatus = (input.status?.toUpperCase() as SphereMemberStatus | undefined) ?? target.status;

  // The last active admin cannot be demoted or deactivated, or the sphere becomes
  // unmanageable.
  if (target.role === "ADMIN" && (nextRole !== "ADMIN" || nextStatus !== "ACTIVE")) {
    const others = await prisma.sphereMember.count({
      where: { sphereId: sphere.id, role: "ADMIN", status: "ACTIVE", id: { not: target.id } },
    });
    if (others === 0) throw badRequest("Cannot remove or demote the last admin from the sphere.");
  }

  const updated = await prisma.sphereMember.update({
    where: { id: target.id },
    data: { role: nextRole, status: nextStatus },
    include: { user: { select: userSelect } },
  });
  await syncMemberCount(sphere.id);

  ok(res, serializeSphereMember(updated, me.id), "Member updated successfully.");
});

spheresRouter.delete("/:id/members/:memberId/", async (req, res) => {
  const { sphere, membership } = await loadVisibleSphere(req);
  if (!membership || membership.status !== "ACTIVE" || !["ADMIN", "MODERATOR"].includes(membership.role)) {
    throw forbidden("Only sphere moderators or admins can remove members.");
  }

  const memberId = Number(req.params.memberId);
  if (!Number.isInteger(memberId) || memberId <= 0) throw notFound("Member not found.");

  const target = await prisma.sphereMember.findFirst({
    where: { id: memberId, sphereId: sphere.id },
  });
  if (!target) throw notFound("Member not found.");

  if (target.role === "ADMIN") {
    const others = await prisma.sphereMember.count({
      where: { sphereId: sphere.id, role: "ADMIN", status: "ACTIVE", id: { not: target.id } },
    });
    if (others === 0) throw badRequest("Cannot remove the last admin from the sphere.");
  }

  await prisma.sphereMember.delete({ where: { id: target.id } });
  await syncMemberCount(sphere.id);
  ok(res, null, "Member removed successfully.");
});

// ── Overview ────────────────────────────────────────────────────────────────

spheresRouter.get("/:id/overview/", async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);
  if (membership?.status !== "ACTIVE") throw forbidden("You must be a member of this sphere.");

  const now = new Date();
  const [counts, overdue, mine, recentFiles, memberCount] = await Promise.all([
    taskCountsFor(sphere.id),
    prisma.task.findMany({
      where: { sphereId: sphere.id, isCompleted: false, dueDate: { lt: now } },
      select: { id: true, title: true, dueDate: true, priority: true, kanbanStatus: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { sphereId: sphere.id, assignedToId: me.id, isCompleted: false },
      select: { id: true, title: true, dueDate: true, priority: true, kanbanStatus: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    // [CHANGE] Django queried Resource.filter(sphere=…) against a column that never
    // existed, inside a bare `except`, so this was always []. Sphere attachments are
    // SphereFile.
    prisma.sphereFile.findMany({
      where: { sphereId: sphere.id },
      select: { id: true, title: true, fileType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.sphereMember.count({ where: { sphereId: sphere.id, status: "ACTIVE" } }),
  ]);

  const shape = (t: { id: number; title: string; dueDate: Date | null; priority: string; kanbanStatus: string }) => ({
    id: t.id,
    title: t.title,
    due_date: t.dueDate?.toISOString() ?? null,
    priority: t.priority.toLowerCase(),
    kanban_status: t.kanbanStatus.toLowerCase(),
  });

  ok(res, {
    progression: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
    total_tasks: counts.total,
    done_tasks: counts.completed,
    overdue_tasks: overdue.map(shape),
    my_tasks: mine.map(shape),
    recent_resources: recentFiles.map((f) => ({
      id: f.id,
      title: f.title,
      type: f.fileType,
      created_at: f.createdAt.toISOString(),
    })),
    unread_messages: 0,
    member_count: memberCount,
  });
});

// ── Banner ──────────────────────────────────────────────────────────────────

/**
 * POST /:id/banner/ — multipart, image only, 10MB.
 *
 * Admins and moderators only: the banner is the sphere's public face, so an
 * ordinary member replacing it would be defacement.
 */
spheresRouter.post("/:id/banner/", singleUpload("banner", "banner"), async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);

  const isMod = membership?.status === "ACTIVE" && ["ADMIN", "MODERATOR"].includes(membership.role);
  if (sphere.createdById !== me.id && !isMod) throw forbidden("Permission denied.");

  const file = req.file;
  if (!file) throw badRequest("No file provided.");

  const stored = await storage.put({
    buffer: file.buffer,
    originalName: file.originalname,
    contentType: file.mimetype,
    prefix: "spheres/banners",
  });

  const previous = sphere.bannerImage;
  const updated = await prisma.sphere.update({
    where: { id: sphere.id },
    data: { bannerImage: stored.url },
    include: sphereInclude,
  });

  // Reclaim the replaced object; best-effort, never fails the request.
  if (previous) {
    const key = keyFromUrl(previous);
    if (key) await storage.delete(key).catch(() => undefined);
  }

  ok(res, serializeSphere(updated, { viewerId: me.id, membership }), "Banner updated.");
});

// ── Files ───────────────────────────────────────────────────────────────────

/**
 * POST /:id/files/ — multipart, active members only.
 *
 * Deliberately a SphereFile rather than a Resource: sphere attachments have no
 * folders, no visibility rules and no impact scoring, and access is simply
 * membership. Conflating the two id spaces is what broke SphereSpheraTab (FE-02).
 */
spheresRouter.post("/:id/files/", singleUpload("file", "sphereFile"), async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);
  if (membership?.status !== "ACTIVE") throw forbidden("You must be a member of this sphere.");

  const file = req.file;
  if (!file) throw badRequest("No file provided.");

  const stored = await storage.put({
    buffer: file.buffer,
    originalName: file.originalname,
    contentType: file.mimetype,
    prefix: `spheres/${sphere.id}/files`,
  });

  const title = String((req.body as { title?: unknown })?.title ?? "").trim() || file.originalname;

  const record = await prisma.sphereFile.create({
    data: {
      sphereId: sphere.id,
      uploadedById: me.id,
      title,
      fileUrl: stored.url,
      storageKey: stored.key,
      fileSize: file.size,
      fileType: file.mimetype || "application/octet-stream",
    },
    include: { uploadedBy: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } } },
  });

  created(res, {
    id: record.id,
    title: record.title,
    file_url: record.fileUrl,
    file_size: record.fileSize,
    file_type: record.fileType,
    uploaded_by: {
      id: record.uploadedBy.id,
      name: `${record.uploadedBy.firstName} ${record.uploadedBy.lastName}`.trim() || record.uploadedBy.username,
      avatar: record.uploadedBy.avatar,
    },
    created_at: record.createdAt.toISOString(),
  });
});

spheresRouter.get("/:id/files/", async (req, res) => {
  const { sphere, membership } = await loadVisibleSphere(req);
  if (membership?.status !== "ACTIVE") throw forbidden("You must be a member of this sphere.");

  const files = await prisma.sphereFile.findMany({
    where: { sphereId: sphere.id },
    include: { uploadedBy: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  list(
    res,
    files.map((f) => ({
      id: f.id,
      title: f.title,
      file_url: f.fileUrl,
      file_size: f.fileSize,
      file_type: f.fileType,
      uploaded_by: {
        id: f.uploadedBy.id,
        name: `${f.uploadedBy.firstName} ${f.uploadedBy.lastName}`.trim() || f.uploadedBy.username,
        avatar: f.uploadedBy.avatar,
      },
      created_at: f.createdAt.toISOString(),
    })),
  );
});

spheresRouter.delete("/:id/files/:fileId/", async (req, res) => {
  const { sphere, membership, me } = await loadVisibleSphere(req);

  const fileId = Number(req.params.fileId);
  if (!Number.isInteger(fileId) || fileId <= 0) throw notFound("File not found.");

  const file = await prisma.sphereFile.findFirst({
    where: { id: fileId, sphereId: sphere.id },
  });
  if (!file) throw notFound("File not found.");

  const isMod = membership?.status === "ACTIVE" && ["ADMIN", "MODERATOR"].includes(membership.role);
  if (file.uploadedById !== me.id && !isMod) throw forbidden("Permission denied.");

  await prisma.sphereFile.delete({ where: { id: file.id } });
  ok(res, null, "File deleted.");
});
