/**
 * Task serialisation — API_CONTRACT §2 `<Task>`.
 */

import type { Prisma, SphereMemberStatus, SphereRole, Task } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";
import { serializeSphere, sphereInclude, type SerializableSphere } from "./sphere.js";

export const taskInclude = {
  assignedTo: { select: userSelect },
  createdBy: { select: userSelect },
  sphere: { include: sphereInclude },
} satisfies Prisma.TaskInclude;

export type SerializableTask = Task & {
  assignedTo: SerializableUser | null;
  createdBy: SerializableUser;
  sphere: SerializableSphere;
};

export interface TaskViewerContext {
  viewerId: number | null;
  /** The viewer's membership in the task's sphere, if any. */
  membership?: { role: SphereRole; status: SphereMemberStatus } | null;
}

/** Derived status, matching Django's `Task.status` property. */
export function taskStatus(task: Pick<Task, "isCompleted" | "dueDate">): "completed" | "overdue" | "pending" {
  if (task.isCompleted) return "completed";
  if (task.dueDate && task.dueDate < new Date()) return "overdue";
  return "pending";
}

export function serializeTask(task: SerializableTask, ctx: TaskViewerContext): Record<string, unknown> {
  const { viewerId, membership = null } = ctx;

  const active = membership?.status === "ACTIVE";
  const isModerator = active && (membership.role === "ADMIN" || membership.role === "MODERATOR");
  const isAdmin = active && membership.role === "ADMIN";
  const isCreator = viewerId !== null && task.createdById === viewerId;
  const isAssignee = viewerId !== null && task.assignedToId === viewerId;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assigned_to: task.assignedToId,
    assigned_to_info: task.assignedTo ? serializeUser(task.assignedTo, { viewerId }) : null,
    priority: task.priority.toLowerCase(),
    due_date: task.dueDate?.toISOString() ?? null,
    is_completed: task.isCompleted,
    kanban_status: task.kanbanStatus.toLowerCase(),
    impact_points: task.impactPoints,
    sphere: task.sphereId,
    sphere_info: serializeSphere(task.sphere, { viewerId, membership }),
    created_by: task.createdById,
    created_by_info: serializeUser(task.createdBy, { viewerId }),
    status: taskStatus(task),
    is_overdue: taskStatus(task) === "overdue",
    can_edit: isCreator || isModerator,
    // Deletion is narrower than editing: creator, or a sphere admin — not a moderator.
    can_delete: isCreator || isAdmin,
    can_complete: isAssignee || isModerator,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
}
