/**
 * Notifications — mounted at /api/notifications/. API_CONTRACT §3.8.
 *
 * Read-side only: rows are produced by services/notifications.ts, which every
 * emitting domain calls. Nothing here creates a notification, because a client
 * being able to fabricate one for another user would be a trivial spoofing
 * primitive.
 *
 * Every route is self-scoped — the recipient is always the caller, taken from the
 * token and never from the request — so one user can neither read nor mutate
 * another's notifications.
 *
 * @status ACTIVE   / <id>/ <id>/read/ read-all/ settings/
 * @status UNUSED   stats/ — implemented, no client caller
 */

import { Router } from "express";
import { z } from "zod";
import { NotificationType, Prisma, type Notification } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { list, noContent, ok, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";

export const notificationsRouter: Router = Router();

// Every notification route is caller-scoped; there is no anonymous view.
notificationsRouter.use(requireAuth);

/**
 * A notification is "recent" for 24 hours. Django computed this in the serialiser
 * with the same window; the client uses it to decide whether to show a dot.
 */
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Human labels, French, matching the Django `NOTIFICATION_TYPES` choices display
 * values. The client renders `type_display` directly when it has no mapping of its
 * own for a type.
 */
const TYPE_DISPLAY: Record<NotificationType, string> = {
  POST_LIKE: "Like sur post",
  POST_COMMENT: "Commentaire sur post",
  COMMENT_REPLY: "Réponse à un commentaire",
  MENTION_POST: "Mention dans un post",
  MENTION_COMMENT: "Mention dans un commentaire",
  SPHERE_INVITATION: "Invitation à une sphère",
  SPHERE_JOIN_REQUEST: "Demande d'adhésion à une sphère",
  TASK_ASSIGNED: "Tâche assignée",
  TASK_COMPLETED: "Tâche terminée",
  RESOURCE_SHARED: "Ressource partagée",
  CONNECTION_REQUEST: "Demande de connexion",
  CONNECTION_ACCEPTED: "Connexion acceptée",
  MESSAGE: "Nouveau message",
  SYSTEM: "Notification système",
  VERIFICATION_STATUS: "Statut de vérification",
  NEW_EVENT: "Nouvel événement",
  EVENT_REMINDER: "Rappel d'événement",
};

function serializeNotification(n: Notification): Record<string, unknown> {
  return {
    id: n.id,
    // Lowercase on the wire; the enum is uppercase in Postgres. The client's
    // notificationTypes.ts compares against the lowercase form.
    type: n.type.toLowerCase(),
    type_display: TYPE_DISPLAY[n.type],
    title: n.title,
    message: n.message,
    recipient: n.recipientId,
    data: n.data ?? {},
    is_read: n.isRead,
    read_at: n.readAt?.toISOString() ?? null,
    is_recent: Date.now() - n.createdAt.getTime() < RECENT_WINDOW_MS,
    created_at: n.createdAt.toISOString(),
  };
}

/** Wire value -> enum member, for the `?type=` filter. */
function parseType(value: string): NotificationType {
  const upper = value.trim().toUpperCase();
  if (upper in NotificationType) return upper as NotificationType;
  throw badRequest(`Unknown notification type '${value}'.`, {
    type: [`Must be one of: ${Object.keys(NotificationType).map((t) => t.toLowerCase()).join(", ")}`],
  });
}

/**
 * Fetch one of the caller's notifications, or 404.
 *
 * Scoped by recipient in the same query rather than fetched-then-checked, so
 * another user's notification is indistinguishable from a missing one.
 */
async function ownNotification(id: number, userId: number): Promise<Notification> {
  const notification = await prisma.notification.findFirst({ where: { id, recipientId: userId } });
  if (!notification) throw notFound("Notification not found.");
  return notification;
}

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw notFound("Notification not found.");
  return id;
}

// ── List ────────────────────────────────────────────────────────────────────

const ORDERINGS: Record<string, Prisma.NotificationOrderByWithRelationInput> = {
  created_at: { createdAt: "asc" },
  "-created_at": { createdAt: "desc" },
  is_read: { isRead: "asc" },
  "-is_read": { isRead: "desc" },
};

notificationsRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.NotificationWhereInput = { recipientId: me.id };

  // `?read=` accepts the string booleans DRF's BooleanFilter took. Anything else is
  // ignored rather than erroring, matching django-filter's behaviour.
  const read = String(req.query.read ?? "").toLowerCase();
  if (["true", "1"].includes(read)) where.isRead = true;
  else if (["false", "0"].includes(read)) where.isRead = false;

  if (req.query.type) where.type = parseType(String(req.query.type));

  const ordering = ORDERINGS[String(req.query.ordering ?? "-created_at")] ?? ORDERINGS["-created_at"];

  const [rows, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: ordering, skip, take: pageSize }),
    prisma.notification.count({ where }),
  ]);

  list(res, rows.map(serializeNotification), paginate(total, page, pageSize));
});

// ── Settings ────────────────────────────────────────────────────────────────
// Declared before /:id/ so the literal path is not captured by the id parameter.

/**
 * Every boolean column, in wire form. Used both to serialise and, as the schema's
 * key set, to validate — so adding a column to the model cannot silently produce a
 * setting the API refuses to update.
 */
const SETTING_FIELDS = [
  "email_post_likes",
  "email_post_comments",
  "email_sphere_invitations",
  "email_task_assignments",
  "email_messages",
  "push_post_likes",
  "push_post_comments",
  "push_sphere_invitations",
  "push_task_assignments",
  "push_messages",
  "in_app_post_likes",
  "in_app_post_comments",
  "in_app_sphere_invitations",
  "in_app_task_assignments",
  "in_app_messages",
  "system_updates",
  "marketing_emails",
] as const;

type SettingField = (typeof SETTING_FIELDS)[number];

/** snake_case wire name -> camelCase Prisma field. */
const toPrismaField = (field: SettingField): string =>
  field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

type SettingsRow = Record<string, unknown> & { id: number; userId: number };

function serializeSettings(row: SettingsRow): Record<string, unknown> {
  const payload: Record<string, unknown> = { id: row.id, user: row.userId };
  for (const field of SETTING_FIELDS) payload[field] = row[toPrismaField(field)];
  return payload;
}

const settingsSchema = z
  .object(Object.fromEntries(SETTING_FIELDS.map((f) => [f, z.boolean().optional()])) as Record<SettingField, z.ZodOptional<z.ZodBoolean>>)
  .strict();

/**
 * Read settings, creating the row on first access.
 *
 * `upsert` rather than find-then-create: two concurrent first reads would
 * otherwise race on the unique userId and one would 500.
 */
notificationsRouter.get("/settings/", async (req, res) => {
  const me = currentUser(req);
  const row = await prisma.notificationSettings.upsert({
    where: { userId: me.id },
    create: { userId: me.id },
    update: {},
  });
  ok(res, serializeSettings(row as unknown as SettingsRow));
});

async function updateSettings(req: Parameters<typeof currentUser>[0], res: Parameters<typeof ok>[0]): Promise<void> {
  const me = currentUser(req);
  const input = settingsSchema.parse(req.body ?? {});

  const data: Record<string, boolean> = {};
  for (const [field, value] of Object.entries(input)) {
    if (value !== undefined) data[toPrismaField(field as SettingField)] = value;
  }

  const row = await prisma.notificationSettings.upsert({
    where: { userId: me.id },
    create: { userId: me.id, ...data },
    update: data,
  });
  ok(res, serializeSettings(row as unknown as SettingsRow), "Notification settings updated.");
}

notificationsRouter.put("/settings/", async (req, res) => updateSettings(req, res));

/** PATCH behaves identically — both are partial, since every field is optional. */
notificationsRouter.patch("/settings/", async (req, res) => updateSettings(req, res));

// ── Bulk read ───────────────────────────────────────────────────────────────

notificationsRouter.put("/read-all/", async (req, res) => {
  const me = currentUser(req);
  const { count } = await prisma.notification.updateMany({
    where: { recipientId: me.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  ok(res, { marked_count: count }, `${count} notification(s) marquée(s) comme lue(s).`);
});

/** @status UNUSED — implemented, no client caller. */
notificationsRouter.get("/stats/", async (req, res) => {
  const me = currentUser(req);

  const [total, unread, byType, recent] = await Promise.all([
    prisma.notification.count({ where: { recipientId: me.id } }),
    prisma.notification.count({ where: { recipientId: me.id, isRead: false } }),
    prisma.notification.groupBy({
      by: ["type"],
      where: { recipientId: me.id },
      _count: { _all: true },
    }),
    prisma.notification.count({
      where: { recipientId: me.id, createdAt: { gte: new Date(Date.now() - RECENT_WINDOW_MS) } },
    }),
  ]);

  ok(res, {
    total,
    unread,
    read: total - unread,
    recent,
    by_type: Object.fromEntries(byType.map((row) => [row.type.toLowerCase(), row._count._all])),
  });
});

// ── Single notification ─────────────────────────────────────────────────────

notificationsRouter.get("/:id/", async (req, res) => {
  const me = currentUser(req);
  ok(res, serializeNotification(await ownNotification(parseId(req.params.id), me.id)));
});

/**
 * PUT and PATCH accept `is_read` only.
 *
 * The rest of a notification is server-authored; letting a client rewrite `title`
 * or `data` would allow it to forge the contents of its own inbox, which matters
 * because `data` carries the ids the UI navigates to.
 */
const updateSchema = z.object({ is_read: z.boolean() }).strict();

async function setRead(req: Parameters<typeof currentUser>[0], res: Parameters<typeof ok>[0]): Promise<void> {
  const me = currentUser(req);
  const existing = await ownNotification(parseId((req.params as { id: string }).id), me.id);
  const { is_read: isRead } = updateSchema.parse(req.body ?? {});

  const updated = await prisma.notification.update({
    where: { id: existing.id },
    // Clearing the flag clears the timestamp too, so `read_at` cannot outlive the
    // state it describes.
    data: { isRead, readAt: isRead ? (existing.readAt ?? new Date()) : null },
  });
  ok(res, serializeNotification(updated));
}

notificationsRouter.put("/:id/", async (req, res) => setRead(req, res));
notificationsRouter.patch("/:id/", async (req, res) => setRead(req, res));

notificationsRouter.delete("/:id/", async (req, res) => {
  const me = currentUser(req);
  const existing = await ownNotification(parseId(req.params.id), me.id);
  await prisma.notification.delete({ where: { id: existing.id } });
  noContent(res);
});

notificationsRouter.put("/:id/read/", async (req, res) => {
  const me = currentUser(req);
  const existing = await ownNotification(parseId(req.params.id), me.id);

  const updated = existing.isRead
    ? existing
    : await prisma.notification.update({
        where: { id: existing.id },
        data: { isRead: true, readAt: new Date() },
      });

  ok(res, serializeNotification(updated), "Notification marquée comme lue.");
});
