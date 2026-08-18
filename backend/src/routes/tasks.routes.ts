/**
 * Tasks — mounted at /api/tasks/. API_CONTRACT §3.6.
 *
 * @status ACTIVE  / <id>/ <id>/complete/ <id>/move/ sphere/<id>/
 * @status UNUSED  <id>/assign/ user/ user/<id>/ — implemented, no client caller
 *
 * Tasks are always sphere-scoped, so every route is gated on active membership of
 * the owning sphere rather than on a global permission.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { NotificationType, Prisma, type KanbanStatus, type SphereMemberStatus, type SphereRole, type TaskPriority } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { serializeTask, taskInclude } from "../serializers/task.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { createNotification } from "../services/notifications.js";

export const tasksRouter: Router = Router();
tasksRouter.use(requireAuth);

const PRIORITIES = ["low", "medium", "high"] as const;
const KANBAN = ["todo", "in_progress", "review", "done"] as const;

type Membership = { role: SphereRole; status: SphereMemberStatus } | null;

async function membershipOf(sphereId: number, userId: number): Promise<Membership> {
  return prisma.sphereMember.findUnique({
    where: { sphereId_userId: { sphereId, userId } },
    select: { role: true, status: true },
  });
}

const isActive = (m: Membership) => m?.status === "ACTIVE";
const isModerator = (m: Membership) => isActive(m) && (m!.role === "ADMIN" || m!.role === "MODERATOR");
const isAdmin = (m: Membership) => isActive(m) && m!.role === "ADMIN";

/** Sphere ids the caller actively belongs to — the scope of every task listing. */
async function memberSphereIds(userId: number): Promise<number[]> {
  const rows = await prisma.sphereMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: { sphereId: true },
  });
  return rows.map((r) => r.sphereId);
}

function taskIdOf(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Task not found.");
  return id;
}

/**
 * Load a task plus the caller's membership of its sphere.
 * 404 rather than 403 for non-members, so sphere contents are not disclosed.
 */
async function loadTask(req: Request) {
  const me = currentUser(req);
  const task = await prisma.task.findUnique({ where: { id: taskIdOf(req) }, include: taskInclude });
  if (!task) throw notFound("Task not found.");

  const membership = await membershipOf(task.sphereId, me.id);
  if (!isActive(membership)) throw notFound("Task not found.");

  return { task, membership, me };
}

function parseDueDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw badRequest("Invalid due_date.", { due_date: ["Invalid date."] });
  return parsed;
}

// ── List / create ───────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().default(""),
  sphere: z.number().int().positive(),
  assigned_to: z.number().int().positive().nullable().optional(),
  priority: z.enum(PRIORITIES).default("medium"),
  due_date: z.string().nullable().optional(),
  impact_points: z.number().int().min(0).max(100).default(5),
  kanban_status: z.enum(KANBAN).default("todo"),
});

tasksRouter.get("/", async (req, res) => {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);
  const search = String(req.query.search ?? "").trim();

  const where: Prisma.TaskWhereInput = {
    sphereId: { in: await memberSphereIds(me.id) },
    ...(search
      ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] }
      : {}),
  };

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: taskInclude,
      skip,
      take: pageSize,
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const memberships = await prisma.sphereMember.findMany({
    where: { userId: me.id, sphereId: { in: tasks.map((t) => t.sphereId) } },
    select: { sphereId: true, role: true, status: true },
  });
  const byId = new Map(memberships.map((m) => [m.sphereId, m]));

  list(
    res,
    tasks.map((t) => serializeTask(t, { viewerId: me.id, membership: byId.get(t.sphereId) ?? null })),
    paginate(total, page, pageSize),
  );
});

tasksRouter.post("/", async (req, res) => {
  const input = createSchema.parse(req.body ?? {});
  const me = currentUser(req);

  const membership = await membershipOf(input.sphere, me.id);
  if (!isActive(membership)) throw badRequest("You must be a member of this sphere to create tasks.", { sphere: ["Not a member."] });

  if (input.assigned_to) {
    const assignee = await membershipOf(input.sphere, input.assigned_to);
    if (!isActive(assignee)) {
      throw badRequest("Assigned user must be an active member of the sphere.", { assigned_to: ["Not a member."] });
    }
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      sphereId: input.sphere,
      createdById: me.id,
      assignedToId: input.assigned_to ?? null,
      priority: input.priority.toUpperCase() as TaskPriority,
      dueDate: parseDueDate(input.due_date),
      impactPoints: input.impact_points,
      kanbanStatus: input.kanban_status.toUpperCase() as KanbanStatus,
    },
    include: taskInclude,
  });

  if (task.assignedToId && task.assignedToId !== me.id) {
    await createNotification({
      type: NotificationType.TASK_ASSIGNED,
      title: "Nouvelle tâche assignée",
      message: `${task.createdBy.firstName} ${task.createdBy.lastName}`.trim() + ` vous a assigné la tâche "${task.title}"`,
      recipientId: task.assignedToId,
      sender: { id: me.id, username: me.username, firstName: task.createdBy.firstName, lastName: task.createdBy.lastName, avatar: task.createdBy.avatar },
      data: { task_id: String(task.id), sphere_id: String(task.sphereId) },
    });
  }

  created(res, serializeTask(task, { viewerId: me.id, membership }));
});

// ── Filtered listings (before /:id/) ────────────────────────────────────────

async function listTasksFor(req: Request, res: Response, where: Prisma.TaskWhereInput) {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: taskInclude,
      skip,
      take: pageSize,
      orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const memberships = await prisma.sphereMember.findMany({
    where: { userId: me.id, sphereId: { in: tasks.map((t) => t.sphereId) } },
    select: { sphereId: true, role: true, status: true },
  });
  const byId = new Map(memberships.map((m) => [m.sphereId, m]));

  list(
    res,
    tasks.map((t) => serializeTask(t, { viewerId: me.id, membership: byId.get(t.sphereId) ?? null })),
    paginate(total, page, pageSize),
  );
}

tasksRouter.get("/user/", async (req, res) => {
  const me = currentUser(req);
  await listTasksFor(req, res, { assignedToId: me.id, sphereId: { in: await memberSphereIds(me.id) } });
});

tasksRouter.get("/user/:userId/", async (req, res) => {
  const me = currentUser(req);
  // Still scoped to the caller's spheres: you may look at another member's tasks,
  // but only within spheres you both belong to.
  await listTasksFor(req, res, {
    assignedToId: Number(req.params.userId),
    sphereId: { in: await memberSphereIds(me.id) },
  });
});

tasksRouter.get("/sphere/:sphereId/", async (req, res) => {
  const me = currentUser(req);
  const sphereId = Number(req.params.sphereId);

  const membership = await membershipOf(sphereId, me.id);
  if (!isActive(membership)) throw forbidden("You must be a member of this sphere.");

  await listTasksFor(req, res, { sphereId });
});

// ── Detail ──────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  assigned_to: z.number().int().positive().nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  due_date: z.string().nullable().optional(),
  impact_points: z.number().int().min(0).max(100).optional(),
  kanban_status: z.enum(KANBAN).optional(),
});

tasksRouter.get("/:id/", async (req, res) => {
  const { task, membership, me } = await loadTask(req);
  ok(res, serializeTask(task, { viewerId: me.id, membership }));
});

async function updateTask(req: Request, res: Response) {
  const { task, membership, me } = await loadTask(req);
  if (task.createdById !== me.id && !isModerator(membership)) {
    throw forbidden("Only the task creator or a sphere moderator can edit this task.");
  }

  const input = updateSchema.parse(req.body ?? {});

  if (input.assigned_to) {
    const assignee = await membershipOf(task.sphereId, input.assigned_to);
    if (!isActive(assignee)) {
      throw badRequest("Assigned user must be an active member of the sphere.", { assigned_to: ["Not a member."] });
    }
  }

  const data: Prisma.TaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) data.priority = input.priority.toUpperCase() as TaskPriority;
  if (input.due_date !== undefined) data.dueDate = parseDueDate(input.due_date);
  if (input.impact_points !== undefined) data.impactPoints = input.impact_points;
  if (input.kanban_status !== undefined) {
    const next = input.kanban_status.toUpperCase() as KanbanStatus;
    data.kanbanStatus = next;
    // Keep the boolean and the column in step; the Kanban board writes one and
    // the task list reads the other.
    data.isCompleted = next === "DONE";
  }
  if (input.assigned_to !== undefined) {
    data.assignedTo = input.assigned_to ? { connect: { id: input.assigned_to } } : { disconnect: true };
  }

  const updated = await prisma.task.update({ where: { id: task.id }, data, include: taskInclude });

  if (input.assigned_to && input.assigned_to !== task.assignedToId && input.assigned_to !== me.id) {
    await createNotification({
      type: NotificationType.TASK_ASSIGNED,
      title: "Nouvelle tâche assignée",
      message: `${updated.createdBy.firstName} ${updated.createdBy.lastName}`.trim() + ` vous a assigné la tâche "${updated.title}"`,
      recipientId: input.assigned_to,
      sender: { id: me.id, username: me.username, firstName: updated.createdBy.firstName, lastName: updated.createdBy.lastName, avatar: updated.createdBy.avatar },
      data: { task_id: String(updated.id), sphere_id: String(updated.sphereId) },
    });
  }

  ok(res, serializeTask(updated, { viewerId: me.id, membership }));
}

tasksRouter.put("/:id/", updateTask);
tasksRouter.patch("/:id/", updateTask);

tasksRouter.delete("/:id/", async (req, res) => {
  const { task, membership, me } = await loadTask(req);
  if (task.createdById !== me.id && !isAdmin(membership)) {
    throw forbidden("Only the task creator or a sphere admin can delete this task.");
  }

  await prisma.task.delete({ where: { id: task.id } });
  res.status(204).send();
});

// ── Actions ─────────────────────────────────────────────────────────────────

tasksRouter.post("/:id/complete/", async (req, res) => {
  const { task, membership, me } = await loadTask(req);
  if (task.assignedToId !== me.id && !isModerator(membership)) {
    throw forbidden("Only the assignee or a sphere moderator can complete this task.");
  }

  if (task.isCompleted) {
    ok(res, serializeTask(task, { viewerId: me.id, membership }), "Task is already complete.");
    return;
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { isCompleted: true, kanbanStatus: "DONE" },
    include: taskInclude,
  });

  // [CHANGE] Completing a task awards NO impact points. Django applied the task's
  // own `impact_points` dynamically, but IMPACT_POLICY.md lists task completion
  // under rules removed on purpose ("à réintégrer dans une phase future"). The
  // document wins, consistently with post creation.
  //
  // `impact_points` is still stored and serialised: the Kanban board displays it,
  // and it is the value the rule will use when it is reintroduced.

  if (updated.assignedToId && updated.assignedToId !== me.id) {
    await createNotification({
      type: NotificationType.TASK_COMPLETED,
      title: "Tâche terminée",
      message: `La tâche "${updated.title}" a été marquée comme terminée`,
      recipientId: updated.assignedToId,
      sender: { id: me.id, username: me.username, firstName: updated.createdBy.firstName, lastName: updated.createdBy.lastName, avatar: updated.createdBy.avatar },
      data: { task_id: String(updated.id), sphere_id: String(updated.sphereId) },
    });
  }

  ok(res, serializeTask(updated, { viewerId: me.id, membership }), "Task completed.");
});

const moveSchema = z.object({ kanban_status: z.enum(KANBAN) });

tasksRouter.patch("/:id/move/", async (req, res) => {
  const { task, membership, me } = await loadTask(req);
  const { kanban_status } = moveSchema.parse(req.body ?? {});

  const next = kanban_status.toUpperCase() as KanbanStatus;
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { kanbanStatus: next, isCompleted: next === "DONE" },
    include: taskInclude,
  });

  ok(res, serializeTask(updated, { viewerId: me.id, membership }));
});

const assignSchema = z.object({
  // [CHANGE] An integer. Django declared this a UUIDField against a 64-bit integer
  // primary key, so the route rejected every valid user id. Unnoticed because no
  // client calls it.
  assigned_to_id: z.number().int().positive().nullable(),
});

tasksRouter.post("/:id/assign/", async (req, res) => {
  const { task, membership, me } = await loadTask(req);
  if (!isModerator(membership)) throw forbidden("Only sphere moderators or admins can assign tasks.");

  const { assigned_to_id: assigneeId } = assignSchema.parse(req.body ?? {});

  if (assigneeId) {
    const assignee = await membershipOf(task.sphereId, assigneeId);
    if (!isActive(assignee)) {
      throw badRequest("User must be an active member of the sphere.", { assigned_to_id: ["Not a member."] });
    }
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { assignedToId: assigneeId },
    include: taskInclude,
  });

  if (assigneeId && assigneeId !== me.id) {
    await createNotification({
      type: NotificationType.TASK_ASSIGNED,
      title: "Nouvelle tâche assignée",
      message: `${updated.createdBy.firstName} ${updated.createdBy.lastName}`.trim() + ` vous a assigné la tâche "${updated.title}"`,
      recipientId: assigneeId,
      sender: { id: me.id, username: me.username, firstName: updated.createdBy.firstName, lastName: updated.createdBy.lastName, avatar: updated.createdBy.avatar },
      data: { task_id: String(updated.id), sphere_id: String(updated.sphereId) },
    });
  }

  ok(res, serializeTask(updated, { viewerId: me.id, membership }));
});
