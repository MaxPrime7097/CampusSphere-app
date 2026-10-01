/**
 * Post and comment serialisation — API_CONTRACT §2 `<Post>`, `<Comment>`, `<File>`.
 */

import type { Comment, Post, Prisma } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";
import { serializeSphere, sphereInclude, type SerializableSphere } from "./sphere.js";

export const postInclude = {
  author: { select: userSelect },
  sphere: { include: sphereInclude },
} satisfies Prisma.PostInclude;

export type SerializablePost = Post & {
  author: SerializableUser;
  sphere: SerializableSphere | null;
};

export const commentInclude = {
  author: { select: userSelect },
} satisfies Prisma.CommentInclude;

export type SerializableComment = Comment & { author: SerializableUser };

/** Normalise a heterogeneous stored file entry into the `<File>` shape. */
export function normalizeFileEntry(entry: unknown): Record<string, unknown> {
  if (typeof entry === "string") {
    return { id: null, name: entry.split("/").pop() ?? "", url: entry, type: "", size: 0 };
  }
  if (entry && typeof entry === "object") {
    const f = entry as Record<string, unknown>;
    return {
      id: f.id ?? null,
      name: f.name ?? f.original_name ?? "",
      url: f.url ?? f.file_url ?? f.file ?? "",
      type: f.type ?? f.file_type ?? "",
      size: f.size ?? f.file_size ?? 0,
    };
  }
  return { id: null, name: "", url: "", type: "", size: 0 };
}

export interface PostViewerContext {
  viewerId: number | null;
  isLiked?: boolean;
  isSaved?: boolean;
  userImpactRating?: number | null;
  canDelete?: boolean;
  recentComments?: SerializableComment[];
  commentLikes?: Set<number>;
}

export function serializePost(post: SerializablePost, ctx: PostViewerContext): Record<string, unknown> {
  const { viewerId } = ctx;

  return {
    id: post.id,
    content: post.content,
    author: post.authorId,
    author_info: serializeUser(post.author, { viewerId }),
    sphere: post.sphereId,
    sphere_info: post.sphere ? serializeSphere(post.sphere, { viewerId }) : null,
    category: post.category.toLowerCase(),
    visibility: post.visibility.toLowerCase(),
    subject: post.subject,
    type: post.type.toLowerCase(),
    audience: post.audience,
    location: post.location,
    tags: post.tags,
    files: Array.isArray(post.files) ? post.files.map(normalizeFileEntry) : [],
    allow_comments: post.allowComments,
    is_pinned: post.isPinned,
    likes_count: post.likesCount,
    comments_count: post.commentsCount,
    impact_score: post.impactScore,
    is_liked: ctx.isLiked ?? false,
    is_saved: ctx.isSaved ?? false,
    can_edit: viewerId !== null && post.authorId === viewerId,
    // Author, or a moderator/admin of the sphere the post belongs to.
    can_delete: ctx.canDelete ?? (viewerId !== null && post.authorId === viewerId),
    user_impact_rating: ctx.userImpactRating ?? null,
    recent_comments: (ctx.recentComments ?? []).map((c) =>
      serializeComment(c, { viewerId, isLiked: ctx.commentLikes?.has(c.id) ?? false }),
    ),
    created_at: post.createdAt.toISOString(),
    updated_at: post.updatedAt.toISOString(),
  };
}

export interface CommentViewerContext {
  viewerId: number | null;
  isLiked?: boolean;
  replies?: SerializableComment[];
  replyLikes?: Set<number>;
}

export function serializeComment(comment: SerializableComment, ctx: CommentViewerContext): Record<string, unknown> {
  const { viewerId } = ctx;
  const mine = viewerId !== null && comment.authorId === viewerId;

  return {
    id: comment.id,
    content: comment.content,
    author: comment.authorId,
    author_info: serializeUser(comment.author, { viewerId }),
    parent: comment.parentId,
    likes_count: comment.likesCount,
    is_liked: ctx.isLiked ?? false,
    // Populated only for top-level comments; nested replies return [].
    replies: (ctx.replies ?? []).map((r) =>
      serializeComment(r, { viewerId, isLiked: ctx.replyLikes?.has(r.id) ?? false }),
    ),
    can_edit: mine,
    can_delete: mine,
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
  };
}
