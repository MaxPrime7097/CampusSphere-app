/**
 * Admin console — mounted at /api/admin/. API_CONTRACT §3.11.
 *
 * Two generations of endpoints, both live: the legacy four (`moderation-queue`,
 * `reported-content`, `user-management-summary`, `permissions`) and the `v1/` set
 * the current console uses.
 *
 * The response envelope here is `{success, data, meta, message}` rather than the
 * standard one — the admin pages read `meta.pagination` — so it is built by
 * `adminOk()` instead of the shared `ok()`.
 *
 * **[CHANGE] Every mutation writes an audit row.** Django defined
 * `log_admin_action` and then called it only from `spheres/views.py`; not one
 * admin_views mutation recorded anything, so bans, verifications and bulk deletes
 * left no trace at all — while `/api/admin/v1/logs/` faithfully displayed the
 * resulting empty table.
 *
 * @status ACTIVE   moderation-queue/ reported-content/ user-management-summary/ permissions/
 * @status ACTIVE   v1/{users,spheres,resources,reports,logs,stats,verification-queue}/
 * @status ACTIVE   v1/users/verify/ v1/users/bulk-ban/ v1/resources/bulk-delete/ v1/reports/bulk-approve/
 * @status UNUSED   v1/posts/ v1/posts/bulk-delete/
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { badRequest, notFound } from "../lib/errors.js";
import { currentUser, requireAdmin, requireAuth } from "../middleware/auth.js";
import { getWeekStartDate } from "../lib/weekHelper.js";

export const adminRouter: Router = Router();

adminRouter.use(requireAuth, requireAdmin);

// ── Envelope ────────────────────────────────────────────────────────────────

interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

function adminOk(res: Response, data: unknown, meta: Record<string, unknown> = {}, message = ""): void {
  res.status(200).json({ success: true, data, meta, message });
}

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

interface ListParams {
  page: number;
  pageSize: number;
  skip: number;
  ordering: string;
  search: string;
}

function listParams(req: Request): ListParams {
  const page = Math.max(1, Math.trunc(Number(req.query.page) || 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(Number(req.query.page_size) || DEFAULT_PAGE_SIZE)));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    ordering: String(req.query.ordering ?? "-created_at"),
    search: String(req.query.search ?? "").trim(),
  };
}

function pagination(total: number, page: number, pageSize: number): { pagination: Pagination } {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    pagination: {
      page,
      page_size: pageSize,
      total_items: total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1,
    },
  };
}

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

/** `-field` means descending, matching DRF's ordering convention. */
function direction(ordering: string): "asc" | "desc" {
  return ordering.startsWith("-") ? "desc" : "asc";
}

function displayName(user: { firstName: string; lastName: string; username: string } | null): string {
  if (!user) return "Utilisateur inconnu";
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function humanSize(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  for (const unit of units) {
    if (size < 1024) return unit === "B" ? `${Math.trunc(size)} B` : `${size.toFixed(1)} ${unit}`;
    size /= 1024;
  }
  return `${size.toFixed(1)} PB`;
}

const actorSelect = { id: true, username: true, firstName: true, lastName: true, avatar: true };

// ── Audit ───────────────────────────────────────────────────────────────────

/**
 * Record an administrative action.
 *
 * Best-effort by design: an audit-log failure must not roll back a moderation
 * decision that has already been applied. It is logged loudly instead, because a
 * silent gap in an audit trail is worse than a noisy one.
 */
async function audit(
  actorId: number,
  action: string,
  targetType: string,
  targetId: string | number | null,
  payloadDiff: Record<string, unknown> = {},
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId: targetId === null ? "" : String(targetId),
        payloadDiff: payloadDiff as Prisma.InputJsonObject,
      },
    });
  } catch (error) {
    console.error("[admin] failed to write audit log", error);
  }
}

const bulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1, 'Le champ "ids" (liste) est obligatoire.'),
});

/** Bulk ids arrive as strings from the console; the PKs are integers. */
function numericIds(ids: Array<string | number>): number[] {
  return ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
}

// ── Permissions matrix ──────────────────────────────────────────────────────

/** Ported verbatim from legacy/django-backend/campus_sphere/admin_permissions.py. */
const PERMISSIONS_MATRIX: Record<string, Record<string, boolean>> = {
  super_admin: { view: true, create: true, update: true, delete: true, export: true },
  admin: { view: true, create: true, update: true, delete: true, export: true },
  moderator: { view: true, create: false, update: true, delete: false, export: false },
  viewer: { view: true, create: false, update: false, delete: false, export: false },
};

/**
 * `is_superuser` → super_admin, `is_staff` → admin.
 *
 * Django's version then fell back to `getattr(user, 'role', '')` or
 * `getattr(user, 'user_type', '')` — neither of which exists on the User model, so
 * that branch always saw `''` and the `moderator` and `viewer` rows of the matrix
 * were unreachable. The matrix is retained verbatim (adding a `role` column later
 * makes those rows live), but the lookup is not pretended to work.
 */
function resolveAdminRole(user: { isSuperuser: boolean; isStaff: boolean }): string | null {
  if (user.isSuperuser) return "super_admin";
  if (user.isStaff) return "admin";
  return null;
}

// ── Legacy endpoints ────────────────────────────────────────────────────────

adminRouter.get("/moderation-queue/", async (_req, res) => {
  const resources = await prisma.resource.findMany({
    include: { author: { select: actorSelect } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  adminOk(
    res,
    resources.map((resource) => ({
      id: String(resource.id),
      title: resource.title,
      type: resource.type.toLowerCase(),
      subject: resource.subject,
      size: humanSize(resource.fileSize),
      uploadDate: resource.createdAt.toISOString(),
      uploader: { name: displayName(resource.author), avatar: resource.author.avatar },
    })),
    {},
    "File de modération chargée.",
  );
});

/**
 * Reported content.
 *
 * Django padded this list with *every* recent post, each labelled
 * "Pending moderation review" with the author cast as the reporter — so the
 * moderation queue was mostly unreported content and every author looked like they
 * had reported themselves. Only genuine reports are listed here.
 */
adminRouter.get("/reported-content/", async (_req, res) => {
  const [postReports, resourceReports] = await Promise.all([
    prisma.postReport.findMany({
      include: { post: { select: { content: true } }, reporter: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.resourceReport.findMany({
      include: { resource: { select: { title: true } }, reporter: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const items = [
    ...postReports.map((report) => ({
      id: String(report.id),
      type: "post",
      content: report.post.content.slice(0, 180),
      reason: report.reason,
      date: report.createdAt.toISOString(),
      status: report.status.toLowerCase(),
      reporter: { name: displayName(report.reporter), avatar: report.reporter.avatar },
    })),
    ...resourceReports.map((report) => ({
      id: String(report.id),
      type: "resource",
      content: report.resource.title.slice(0, 180),
      reason: report.reason,
      date: report.createdAt.toISOString(),
      status: report.status.toLowerCase(),
      reporter: { name: displayName(report.reporter), avatar: report.reporter.avatar },
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  adminOk(res, items, {}, "Contenu signalé chargé.");
});

adminRouter.get("/user-management-summary/", async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalUsers, newUsersToday, totalResources, pendingPostReports, pendingResourceReports, activeSpheres] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { dateJoined: { gte: startOfDay } } }),
      prisma.resource.count(),
      prisma.postReport.count({ where: { status: "PENDING" } }),
      prisma.resourceReport.count({ where: { status: "PENDING" } }),
      prisma.sphere.count(),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      newUsersToday,
      pendingResources: totalResources,
      // Django counted every post here, so "reported content" was really "all
      // content" and the number only ever went up.
      reportedContent: pendingPostReports + pendingResourceReports,
      activeGroups: activeSpheres,
      totalResources,
    },
  });
});

adminRouter.get("/permissions/", async (req, res) => {
  const me = currentUser(req);
  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { isSuperuser: true, isStaff: true },
  });
  if (!user) throw notFound("User not found.");

  const role = resolveAdminRole(user);
  res.status(200).json({
    success: true,
    data: {
      role,
      permissions: role
        ? PERMISSIONS_MATRIX[role]
        : { view: false, create: false, update: false, delete: false, export: false },
    },
  });
});

// ── v1: users ───────────────────────────────────────────────────────────────

adminRouter.get("/v1/users/", async (req, res) => {
  const { page, pageSize, skip, ordering, search } = listParams(req);

  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { username: contains(search) },
          { firstName: contains(search) },
          { lastName: contains(search) },
          { email: contains(search) },
        ],
      }
    : {};

  // `created_at` is `date_joined` on this model; the console sends the former.
  const orderBy: Prisma.UserOrderByWithRelationInput = ordering.includes("created_at")
    ? { dateJoined: direction(ordering) }
    : { dateJoined: "desc" };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy, skip, take: pageSize }),
    prisma.user.count({ where }),
  ]);

  adminOk(
    res,
    users.map((user) => ({
      id: String(user.id),
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      studentId: user.studentId,
      cardImage: user.cardImage,
      dateJoined: user.dateJoined.toISOString(),
    })),
    pagination(total, page, pageSize),
  );
});

adminRouter.post("/v1/users/bulk-ban/", async (req, res) => {
  const me = currentUser(req);
  const { ids } = bulkIdsSchema.parse(req.body ?? {});
  const targets = numericIds(ids);

  // Superusers are excluded, as in Django — an admin must not be able to lock the
  // platform owners out. `me.id` is excluded too: banning yourself mid-request
  // leaves nobody able to undo it.
  const { count } = await prisma.user.updateMany({
    where: { id: { in: targets }, isSuperuser: false, NOT: { id: me.id } },
    data: { isActive: false },
  });

  await audit(me.id, "users.bulk_ban", "user", null, { ids: targets, updated: count });
  adminOk(res, { updated: count }, {}, "Utilisateurs bannis.");
});

const verifySchema = z.object({
  userId: z.union([z.string(), z.number()]),
  isVerified: z.boolean().default(true),
});

adminRouter.post("/v1/users/verify/", async (req, res) => {
  const me = currentUser(req);
  const parsed = verifySchema.safeParse(req.body ?? {});
  if (!parsed.success) throw badRequest('Le champ "userId" est obligatoire.');

  const userId = Number(parsed.data.userId);
  if (!Number.isInteger(userId)) throw badRequest("Utilisateur non trouvé.");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isVerified: true } });
  if (!user) throw badRequest("Utilisateur non trouvé.");

  await prisma.user.update({ where: { id: userId }, data: { isVerified: parsed.data.isVerified } });
  await audit(me.id, "users.verify", "user", userId, {
    from: user.isVerified,
    to: parsed.data.isVerified,
  });

  // Tell the student. Django's admin path updated the flag and told nobody.
  const { notifyVerificationStatus } = await import("../services/notifications.js");
  if (parsed.data.isVerified !== user.isVerified) await notifyVerificationStatus(userId, parsed.data.isVerified);

  adminOk(res, null, {}, "Statut de vérification mis à jour.");
});

adminRouter.get("/v1/verification-queue/", async (req, res) => {
  const { page, pageSize, skip, search } = listParams(req);

  const where: Prisma.UserWhereInput = {
    isVerified: false,
    studentId: { not: "" },
    ...(search ? { OR: [{ username: contains(search) }, { studentId: contains(search) }] } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { updatedAt: "desc" }, skip, take: pageSize }),
    prisma.user.count({ where }),
  ]);

  adminOk(
    res,
    users.map((user) => ({
      id: String(user.id),
      username: user.username,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      studentId: user.studentId,
      cardImage: user.cardImage,
      dateJoined: user.dateJoined.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
    pagination(total, page, pageSize),
  );
});

// ── v1: spheres, posts, resources ───────────────────────────────────────────

adminRouter.get("/v1/spheres/", async (req, res) => {
  const { page, pageSize, skip, ordering, search } = listParams(req);

  const where: Prisma.SphereWhereInput = search
    ? { OR: [{ name: contains(search) }, { description: contains(search) }] }
    : {};

  const [spheres, total] = await Promise.all([
    prisma.sphere.findMany({ where, orderBy: { createdAt: direction(ordering) }, skip, take: pageSize }),
    prisma.sphere.count({ where }),
  ]);

  adminOk(
    res,
    spheres.map((sphere) => ({
      id: String(sphere.id),
      name: sphere.name,
      description: sphere.description,
      createdAt: sphere.createdAt.toISOString(),
      updatedAt: sphere.updatedAt.toISOString(),
    })),
    pagination(total, page, pageSize),
  );
});

/** @status UNUSED — no console call site. */
adminRouter.get("/v1/posts/", async (req, res) => {
  const { page, pageSize, skip, ordering, search } = listParams(req);

  const where: Prisma.PostWhereInput = search
    ? { OR: [{ content: contains(search) }, { author: { username: contains(search) } }] }
    : {};

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: actorSelect } },
      orderBy: { createdAt: direction(ordering) },
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  adminOk(
    res,
    posts.map((post) => ({
      id: String(post.id),
      content: post.content,
      author: displayName(post.author),
      createdAt: post.createdAt.toISOString(),
    })),
    pagination(total, page, pageSize),
  );
});

/** @status UNUSED — no console call site. */
adminRouter.post("/v1/posts/bulk-delete/", async (req, res) => {
  const me = currentUser(req);
  const { ids } = bulkIdsSchema.parse(req.body ?? {});
  const targets = numericIds(ids);

  const { count } = await prisma.post.deleteMany({ where: { id: { in: targets } } });
  await audit(me.id, "posts.bulk_delete", "post", null, { ids: targets, deleted: count });
  adminOk(res, { deleted: count }, {}, "Posts supprimés.");
});

adminRouter.get("/v1/resources/", async (req, res) => {
  const { page, pageSize, skip, ordering, search } = listParams(req);

  const where: Prisma.ResourceWhereInput = search
    ? {
        OR: [
          { title: contains(search) },
          { subject: contains(search) },
          { author: { username: contains(search) } },
        ],
      }
    : {};

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: { author: { select: actorSelect } },
      orderBy: { createdAt: direction(ordering) },
      skip,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  adminOk(
    res,
    resources.map((resource) => ({
      id: String(resource.id),
      title: resource.title,
      subject: resource.subject,
      type: resource.type.toLowerCase(),
      author: displayName(resource.author),
      createdAt: resource.createdAt.toISOString(),
    })),
    pagination(total, page, pageSize),
  );
});

adminRouter.post("/v1/resources/bulk-delete/", async (req, res) => {
  const me = currentUser(req);
  const { ids } = bulkIdsSchema.parse(req.body ?? {});
  const targets = numericIds(ids);

  const { count } = await prisma.resource.deleteMany({ where: { id: { in: targets } } });
  await audit(me.id, "resources.bulk_delete", "resource", null, { ids: targets, deleted: count });
  adminOk(res, { deleted: count }, {}, "Ressources supprimées.");
});

// ── v1: reports ─────────────────────────────────────────────────────────────

/**
 * Post and resource reports in one list.
 *
 * Ids are prefixed (`post-12`, `resource-12`) because the two tables have
 * independent sequences; without the prefix, bulk-approve cannot tell which table
 * an id belongs to.
 */
adminRouter.get("/v1/reports/", async (req, res) => {
  const { page, pageSize, search } = listParams(req);

  const postWhere: Prisma.PostReportWhereInput = search
    ? {
        OR: [
          { reason: contains(search) },
          { post: { content: contains(search) } },
          { reporter: { username: contains(search) } },
        ],
      }
    : {};
  const resourceWhere: Prisma.ResourceReportWhereInput = search
    ? {
        OR: [
          { reason: contains(search) },
          { resource: { title: contains(search) } },
          { reporter: { username: contains(search) } },
        ],
      }
    : {};

  const [postReports, resourceReports] = await Promise.all([
    prisma.postReport.findMany({
      where: postWhere,
      include: { reporter: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.resourceReport.findMany({
      where: resourceWhere,
      include: { reporter: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const items = [
    ...postReports.map((report) => ({
      id: `post-${report.id}`,
      source: "post",
      targetId: String(report.postId),
      reason: report.reason,
      status: report.status.toLowerCase(),
      createdAt: report.createdAt.toISOString(),
      reporter: displayName(report.reporter),
    })),
    ...resourceReports.map((report) => ({
      id: `resource-${report.id}`,
      source: "resource",
      targetId: String(report.resourceId),
      reason: report.reason,
      status: report.status.toLowerCase(),
      createdAt: report.createdAt.toISOString(),
      reporter: displayName(report.reporter),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const start = (page - 1) * pageSize;
  adminOk(res, items.slice(start, start + pageSize), pagination(items.length, page, pageSize));
});

adminRouter.post("/v1/reports/bulk-approve/", async (req, res) => {
  const me = currentUser(req);
  const { ids } = bulkIdsSchema.parse(req.body ?? {});

  const postIds: number[] = [];
  const resourceIds: number[] = [];

  for (const raw of ids) {
    const value = String(raw);
    if (value.startsWith("post-")) postIds.push(Number(value.slice(5)));
    else if (value.startsWith("resource-")) resourceIds.push(Number(value.slice(9)));
    else {
      // Unprefixed: ambiguous, so it goes to both tables — Django's behaviour, kept
      // because the console still sends bare ids from older cached pages.
      postIds.push(Number(value));
      resourceIds.push(Number(value));
    }
  }

  const [postUpdated, resourceUpdated] = await Promise.all([
    prisma.postReport.updateMany({
      where: { id: { in: postIds.filter(Number.isInteger) } },
      data: { status: "REVIEWED" },
    }),
    prisma.resourceReport.updateMany({
      where: { id: { in: resourceIds.filter(Number.isInteger) } },
      data: { status: "REVIEWED" },
    }),
  ]);

  await audit(me.id, "reports.bulk_approve", "report", null, {
    postReportsUpdated: postUpdated.count,
    resourceReportsUpdated: resourceUpdated.count,
  });

  adminOk(
    res,
    { postReportsUpdated: postUpdated.count, resourceReportsUpdated: resourceUpdated.count },
    {},
    "Signalements approuvés.",
  );
});

// ── v1: logs and stats ──────────────────────────────────────────────────────

adminRouter.get("/v1/logs/", async (req, res) => {
  const { page, pageSize, skip, search } = listParams(req);

  const where: Prisma.AdminAuditLogWhereInput = search
    ? {
        OR: [
          { action: contains(search) },
          { targetType: contains(search) },
          { actor: { username: contains(search) } },
        ],
      }
    : {};

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      include: { actor: { select: actorSelect } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  adminOk(
    res,
    logs.map((log) => ({
      id: String(log.id),
      actor: displayName(log.actor),
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId || null,
      createdAt: log.createdAt.toISOString(),
    })),
    pagination(total, page, pageSize),
  );
});

adminRouter.get("/v1/stats/", async (req, res) => {
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [newUsers, activeSpheres, pendingPostReports, pendingResourceReports, overdueTasks, unreadNotifications] =
    await Promise.all([
      prisma.user.count({ where: { dateJoined: { gte: startOfDay } } }),
      prisma.sphere.count(),
      prisma.postReport.count({ where: { status: "PENDING" } }),
      prisma.resourceReport.count({ where: { status: "PENDING" } }),
      prisma.task.count({ where: { dueDate: { lt: now }, isCompleted: false } }),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

  adminOk(res, {
    newUsers,
    activeSpheres,
    pendingReports: pendingPostReports + pendingResourceReports,
    overdueTasks,
    // Django labelled this "failedNotifications" while counting unread ones. The
    // key is kept — the console reads it — but it means what it always measured.
    failedNotifications: unreadNotifications,
    range: String(req.query.range ?? "24h"),
    startDate: req.query.startDate ? String(req.query.startDate) : null,
    endDate: req.query.endDate ? String(req.query.endDate) : null,
  });
});

// ── AI Usage & Bedrock Budget Tracking ─────────────────────────────────────

async function aiUsageSummaryHandler(_req: Request, res: Response): Promise<void> {
  const TOTAL_BUDGET_USD = env.ai.bedrock.budgetUsd || 90;

  try {
    const totalSpentResult = await prisma.aIUsageLog.aggregate({
      where: { provider: "bedrock" },
      _sum: { estimatedCostUSD: true },
      _count: true,
    });
    const spent = totalSpentResult._sum.estimatedCostUSD ?? 0;
    const totalGenerations = totalSpentResult._count;

    // Consommation des 7 derniers jours pour projeter la tendance
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSpentResult = await prisma.aIUsageLog.aggregate({
      where: { provider: "bedrock", createdAt: { gte: sevenDaysAgo } },
      _sum: { estimatedCostUSD: true },
      _count: true,
    });
    const weeklyRate = recentSpentResult._sum.estimatedCostUSD ?? 0;
    const remaining = Math.max(0, TOTAL_BUDGET_USD - spent);
    const weeksRemaining = weeklyRate > 0 ? (remaining / weeklyRate).toFixed(1) : null;

    // Répartition par type d'outil
    const breakdown = await prisma.aIUsageLog.groupBy({
      by: ["toolType"],
      where: { provider: "bedrock" },
      _sum: { estimatedCostUSD: true, inputTokensEstimate: true, outputTokensEstimate: true },
      _count: true,
    });

    const data = {
      totalBudget: TOTAL_BUDGET_USD,
      spent: Number(spent.toFixed(4)),
      remaining: Number(remaining.toFixed(4)),
      percentUsed: Number(((spent / TOTAL_BUDGET_USD) * 100).toFixed(1)),
      weeklyBurnRate: Number(weeklyRate.toFixed(4)),
      estimatedWeeksRemaining: weeksRemaining ? Number(weeksRemaining) : null,
      totalGenerations,
      recentGenerations7d: recentSpentResult._count,
      model: env.ai.bedrock.modelId,
      safetyThresholdPercent: env.ai.bedrock.safetyThresholdPercent,
      safetyThresholdUSD: Number(((TOTAL_BUDGET_USD * env.ai.bedrock.safetyThresholdPercent) / 100).toFixed(2)),
      isThresholdExceeded: (spent / TOTAL_BUDGET_USD) * 100 >= env.ai.bedrock.safetyThresholdPercent,
      breakdownByTool: breakdown.map((b) => ({
        toolType: b.toolType,
        count: b._count,
        totalCostUSD: Number((b._sum.estimatedCostUSD ?? 0).toFixed(4)),
        inputTokens: b._sum.inputTokensEstimate ?? 0,
        outputTokens: b._sum.outputTokensEstimate ?? 0,
      })),
    };

    adminOk(res, data, {}, "Résumé de consommation IA Bedrock chargé.");
  } catch (error) {
    console.warn("[admin-ai-summary] Warning: AIUsageLog query failed, returning zeroed stats:", error);
    adminOk(res, {
      totalBudget: TOTAL_BUDGET_USD,
      spent: 0,
      remaining: TOTAL_BUDGET_USD,
      percentUsed: 0,
      weeklyBurnRate: 0,
      estimatedWeeksRemaining: null,
      totalGenerations: 0,
      recentGenerations7d: 0,
      model: env.ai.bedrock.modelId,
      safetyThresholdPercent: env.ai.bedrock.safetyThresholdPercent,
      safetyThresholdUSD: Number(((TOTAL_BUDGET_USD * env.ai.bedrock.safetyThresholdPercent) / 100).toFixed(2)),
      isThresholdExceeded: false,
      breakdownByTool: [],
    }, {}, "Données par défaut initialisées.");
  }
}

adminRouter.get("/ai-usage-summary", aiUsageSummaryHandler);
adminRouter.get("/ai-usage-summary/", aiUsageSummaryHandler);
adminRouter.get("/v1/ai-usage-summary", aiUsageSummaryHandler);
adminRouter.get("/v1/ai-usage-summary/", aiUsageSummaryHandler);

async function spheraDetailedStatsHandler(_req: Request, res: Response): Promise<void> {
  const TOTAL_BUDGET_USD = env.ai.bedrock.budgetUsd || 90;
  const weekStart = getWeekStartDate();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  try {
    // 1. Bedrock Budget & Totals
    const [totalSpentResult, recentSpentResult, totalGenerationsAllProviders] = await Promise.all([
      prisma.aIUsageLog.aggregate({
        where: { provider: "bedrock" },
        _sum: { estimatedCostUSD: true, inputTokensEstimate: true, outputTokensEstimate: true },
        _count: true,
      }),
      prisma.aIUsageLog.aggregate({
        where: { provider: "bedrock", createdAt: { gte: sevenDaysAgo } },
        _sum: { estimatedCostUSD: true },
        _count: true,
      }),
      prisma.aIUsageLog.count(),
    ]);

    const spent = totalSpentResult._sum.estimatedCostUSD ?? 0;
    const totalBedrockGenerations = totalSpentResult._count;
    const weeklyRate = recentSpentResult._sum.estimatedCostUSD ?? 0;
    const remaining = Math.max(0, TOTAL_BUDGET_USD - spent);
    const weeksRemaining = weeklyRate > 0 ? (remaining / weeklyRate).toFixed(1) : null;

    // 2. Weekly Quota & Student Saturation
    let weeklyUsages: any[] = [];
    try {
      weeklyUsages = await prisma.generationUsage.findMany({
        where: { weekStartDate: weekStart },
        include: {
          user: {
            select: {
              id: true,
              university: true,
              faculty: true,
              studyYear: true,
            },
          },
        },
      });
    } catch (err) {
      console.warn("[sphera-stats] Could not fetch GenerationUsage:", err);
    }

    const activeStudentsThisWeek = weeklyUsages.length;
    const saturatedCount = weeklyUsages.filter((u) => u.count >= 5).length;
    const totalWeeklyGenerations = weeklyUsages.reduce((acc, u) => acc + u.count, 0);
    const avgWeeklyGens = activeStudentsThisWeek > 0
      ? Number((totalWeeklyGenerations / activeStudentsThisWeek).toFixed(1))
      : 0;
    const saturatedPercent = activeStudentsThisWeek > 0
      ? Number(((saturatedCount / activeStudentsThisWeek) * 100).toFixed(1))
      : 0;

    // Quota distribution (0-1, 2-3, 4, 5)
    const quotaDistribution = [
      { range: "1-2 gén.", count: weeklyUsages.filter((u) => u.count >= 1 && u.count <= 2).length },
      { range: "3-4 gén.", count: weeklyUsages.filter((u) => u.count >= 3 && u.count <= 4).length },
      { range: "5/5 (Max)", count: saturatedCount },
    ];

    // 3. Demographics (Top Universities & Faculties)
    const uniMap = new Map<string, number>();
    const facultyMap = new Map<string, number>();
    const yearMap = new Map<string, number>();

    for (const u of weeklyUsages) {
      if (u.user?.university) {
        uniMap.set(u.user.university, (uniMap.get(u.user.university) || 0) + u.count);
      }
      if (u.user?.faculty) {
        facultyMap.set(u.user.faculty, (facultyMap.get(u.user.faculty) || 0) + u.count);
      }
      if (u.user?.studyYear) {
        yearMap.set(u.user.studyYear, (yearMap.get(u.user.studyYear) || 0) + u.count);
      }
    }

    const topUniversities = Array.from(uniMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topFaculties = Array.from(facultyMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topStudyYears = Array.from(yearMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Breakdown by tool
    const toolBreakdown = await prisma.aIUsageLog.groupBy({
      by: ["toolType"],
      _sum: { estimatedCostUSD: true, inputTokensEstimate: true, outputTokensEstimate: true },
      _count: true,
    });

    const tools = toolBreakdown.map((b) => ({
      toolType: b.toolType || "inconnu",
      count: b._count,
      totalCostUSD: Number((b._sum.estimatedCostUSD ?? 0).toFixed(4)),
      inputTokens: b._sum.inputTokensEstimate ?? 0,
      outputTokens: b._sum.outputTokensEstimate ?? 0,
      averageCostUSD: b._count > 0 ? Number(((b._sum.estimatedCostUSD ?? 0) / b._count).toFixed(4)) : 0,
    })).sort((a, b) => b.count - a.count);

    // 5. Providers breakdown
    const providerBreakdown = await prisma.aIUsageLog.groupBy({
      by: ["provider"],
      _sum: { estimatedCostUSD: true },
      _count: true,
    });

    const providers = providerBreakdown.map((p) => ({
      provider: p.provider,
      count: p._count,
      totalCostUSD: Number((p._sum.estimatedCostUSD ?? 0).toFixed(4)),
    }));

    // 6. Timeline (Last 14 days)
    const recentLogs14d = await prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, estimatedCostUSD: true, inputTokensEstimate: true, outputTokensEstimate: true },
      orderBy: { createdAt: "asc" },
    });

    const timelineMap = new Map<string, { date: string; count: number; costUSD: number; tokens: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      timelineMap.set(key, { date: key, count: 0, costUSD: 0, tokens: 0 });
    }

    for (const log of recentLogs14d) {
      const key = log.createdAt.toISOString().slice(0, 10);
      const entry = timelineMap.get(key);
      if (entry) {
        entry.count += 1;
        entry.costUSD += log.estimatedCostUSD;
        entry.tokens += (log.inputTokensEstimate + log.outputTokensEstimate);
      }
    }

    const timeline = Array.from(timelineMap.values()).map((t) => ({
      ...t,
      costUSD: Number(t.costUSD.toFixed(4)),
    }));

    // 7. Recent generation activity logs (last 20)
    const recentLogs = await prisma.aIUsageLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        provider: true,
        toolType: true,
        inputTokensEstimate: true,
        outputTokensEstimate: true,
        estimatedCostUSD: true,
        createdAt: true,
      },
    });

    const responseData = {
      budget: {
        totalBudget: TOTAL_BUDGET_USD,
        spent: Number(spent.toFixed(4)),
        remaining: Number(remaining.toFixed(4)),
        percentUsed: Number(((spent / TOTAL_BUDGET_USD) * 100).toFixed(1)),
        weeklyBurnRate: Number(weeklyRate.toFixed(4)),
        estimatedWeeksRemaining: weeksRemaining ? Number(weeksRemaining) : null,
        totalBedrockGenerations,
        totalGenerationsAllProviders,
        model: env.ai.bedrock.modelId,
        safetyThresholdPercent: env.ai.bedrock.safetyThresholdPercent,
        safetyThresholdUSD: Number(((TOTAL_BUDGET_USD * env.ai.bedrock.safetyThresholdPercent) / 100).toFixed(2)),
        isThresholdExceeded: (spent / TOTAL_BUDGET_USD) * 100 >= env.ai.bedrock.safetyThresholdPercent,
      },
      quotas: {
        activeStudentsThisWeek,
        saturatedCount,
        saturatedPercent,
        totalWeeklyGenerations,
        avgWeeklyGens,
        distribution: quotaDistribution,
      },
      tools,
      providers,
      timeline,
      demographics: {
        topUniversities,
        topFaculties,
        topStudyYears,
      },
      recentLogs,
    };

    adminOk(res, responseData, {}, "Statistiques détaillées Sphera chargées.");
  } catch (error) {
    console.warn("[sphera-detailed-stats] Warning: Sphera stats query failed, returning safe defaults:", error);
    adminOk(res, {
      budget: {
        totalBudget: TOTAL_BUDGET_USD,
        spent: 0,
        remaining: TOTAL_BUDGET_USD,
        percentUsed: 0,
        weeklyBurnRate: 0,
        estimatedWeeksRemaining: null,
        totalBedrockGenerations: 0,
        totalGenerationsAllProviders: 0,
        model: env.ai.bedrock.modelId,
        safetyThresholdPercent: env.ai.bedrock.safetyThresholdPercent,
        safetyThresholdUSD: Number(((TOTAL_BUDGET_USD * env.ai.bedrock.safetyThresholdPercent) / 100).toFixed(2)),
        isThresholdExceeded: false,
      },
      quotas: {
        activeStudentsThisWeek: 0,
        saturatedCount: 0,
        saturatedPercent: 0,
        totalWeeklyGenerations: 0,
        avgWeeklyGens: 0,
        distribution: [],
      },
      tools: [],
      providers: [],
      timeline: [],
      demographics: {
        topUniversities: [],
        topFaculties: [],
        topStudyYears: [],
      },
      recentLogs: [],
    }, {}, "Statistiques Sphera initialisées par défaut.");
  }
}

adminRouter.get("/sphera-stats", spheraDetailedStatsHandler);
adminRouter.get("/sphera-stats/", spheraDetailedStatsHandler);
adminRouter.get("/v1/sphera-stats", spheraDetailedStatsHandler);
adminRouter.get("/v1/sphera-stats/", spheraDetailedStatsHandler);


