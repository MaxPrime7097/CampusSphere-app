/**
 * Resource and folder serialisation — API_CONTRACT §2 `<Resource>`.
 *
 * Note the absence of `sphere_id`. Django's serializer declared it and swallowed
 * the resulting error, so it was always null, while the create serializer accepted a
 * `sphere` key and assigned it to a column that never existed — a 500 on write.
 * Sphere attachments are `SphereFile`.
 */

import type { Prisma, Resource, ResourceFolder } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";

export const resourceInclude = {
  author: {
    select: {
      ...userSelect,
      _count: {
        select: {
          resources: true,
          posts: true,
        },
      },
    },
  },
  folder: { select: { id: true, name: true } },
} satisfies Prisma.ResourceInclude;

export type SerializableResource = Resource & {
  author: SerializableUser;
  folder: { id: number; name: string } | null;
};

export interface ResourceViewerContext {
  viewerId: number | null;
  isSaved?: boolean;
}

export function serializeResource(resource: SerializableResource, ctx: ResourceViewerContext): Record<string, unknown> {
  const { viewerId } = ctx;
  const mine = viewerId !== null && resource.authorId === viewerId;

  const authorCounts = (resource.author as any)?._count;
  const authorContributions = authorCounts
    ? ((authorCounts.resources ?? 0) + (authorCounts.posts ?? 0))
    : 1;

  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    author: resource.authorId,
    author_info: serializeUser(resource.author, {
      viewerId,
      counts: { contributions: Math.max(1, authorContributions) },
    }),
    file: resource.fileUrl,
    file_info: {
      id: String(resource.id),
      name: resource.title,
      url: resource.fileUrl,
      size: resource.fileSize,
      type: resource.fileType,
    },
    file_size: resource.fileSize,
    file_type: resource.fileType,
    subject: resource.subject,
    type: resource.type.toLowerCase(),
    visibility: resource.visibility.toLowerCase(),
    audience: resource.audience,
    folder_id: resource.folderId,
    folder_info: resource.folder ? { id: resource.folder.id, name: resource.folder.name } : null,
    tags: resource.tags,
    impact_score: resource.impactScore,
    stats: {
      downloads: resource.downloadsCount,
      views: resource.viewsCount,
      saves: resource.savesCount,
    },
    is_saved: ctx.isSaved ?? false,
    can_edit: mine,
    can_delete: mine,
    created_at: resource.createdAt.toISOString(),
    updated_at: resource.updatedAt.toISOString(),
  };
}

export function serializeFolder(
  folder: ResourceFolder & { _count?: { resources?: number; items?: number } },
  viewerId: number | null,
): Record<string, unknown> {
  const resourceCount = (folder._count?.items ?? 0) + (folder._count?.resources ?? 0);

  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    visibility: folder.visibility.toLowerCase(),
    resource_count: resourceCount,
    can_edit: viewerId !== null && folder.ownerId === viewerId,
    created_at: folder.createdAt.toISOString(),
    updated_at: folder.updatedAt.toISOString(),
  };
}
