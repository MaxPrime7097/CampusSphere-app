/**
 * Sphere serialisation — API_CONTRACT §2 `<Sphere>` and `<SphereMember>`.
 */

import type { Prisma, Sphere, SphereMember, SphereMemberStatus, SphereRole } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";

export const sphereInclude = {
  createdBy: { select: userSelect },
} satisfies Prisma.SphereInclude;

export type SerializableSphere = Sphere & { createdBy: SerializableUser };

export interface SphereViewerContext {
  viewerId: number | null;
  /** The viewer's membership row, if any. Null means not a member. */
  membership?: { role: SphereRole; status: SphereMemberStatus } | null;
  /** Completed / total tasks, for the progression percentage. */
  taskCounts?: { total: number; completed: number };
}

export function serializeSphere(sphere: SerializableSphere, ctx: SphereViewerContext): Record<string, unknown> {
  const { viewerId, membership = null, taskCounts } = ctx;

  const progression =
    taskCounts && taskCounts.total > 0 ? Math.round((taskCounts.completed / taskCounts.total) * 100) : 0;

  return {
    id: sphere.id,
    name: sphere.name,
    description: sphere.description,
    category: sphere.category.toLowerCase(),
    sphere_type: sphere.sphereType.toLowerCase(),
    color: sphere.color,
    icon: sphere.icon,
    banner_image: sphere.bannerImage,
    banner_image_url: sphere.bannerImage,
    is_private: sphere.isPrivate,
    require_approval: sphere.requireApproval,
    objective: sphere.objective,
    target_audience: sphere.targetAudience,
    duration: sphere.duration,
    expires_at: sphere.expiresAt?.toISOString() ?? null,
    auto_delete_on_expiry: sphere.autoDeleteOnExpiry,
    collaboration_types: sphere.collaborationTypes,
    member_count: sphere.memberCount,
    impact_score: sphere.impactScore,
    progression,
    created_by: sphere.createdById,
    created_by_info: serializeUser(sphere.createdBy, { viewerId }),
    is_member: membership?.status === "ACTIVE",
    membership_status: membership ? membership.status.toLowerCase() : null,
    user_role: membership?.status === "ACTIVE" ? membership.role.toLowerCase() : null,
    is_expired: Boolean(sphere.expiresAt && sphere.expiresAt <= new Date()),
    created_at: sphere.createdAt.toISOString(),
    updated_at: sphere.updatedAt.toISOString(),
  };
}

const ROLE_LABELS: Record<SphereRole, string> = {
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  MEMBER: "Membre",
};

const STATUS_LABELS: Record<SphereMemberStatus, string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  INACTIVE: "Inactif",
  BANNED: "Banni",
};

export function serializeSphereMember(
  member: SphereMember & { user: SerializableUser },
  viewerId: number | null,
): Record<string, unknown> {
  return {
    // The membership row id — member management routes address this, not the user id.
    id: member.id,
    user: member.userId,
    user_info: serializeUser(member.user, { viewerId }),
    role: member.role.toLowerCase(),
    role_display: ROLE_LABELS[member.role],
    status: member.status.toLowerCase(),
    status_display: STATUS_LABELS[member.status],
    joined_at: member.joinedAt.toISOString(),
  };
}
