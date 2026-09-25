/**
 * Posts and comments — mounted at /api/posts/. API_CONTRACT §3.4.
 *
 * @status ACTIVE  / <id>/ <id>/like/ <id>/save/ <id>/report/ <id>/impact-rate/
 * @status ACTIVE  <id>/comments/ comments/<id>/ comments/<id>/like/ saved/ user/<id>/
 * @status UNUSED  <id>/pin/  sphere/<id>/  — implemented, no client caller
 *
 * Attachments are two steps, as on the web client: upload the bytes to
 * `POST /api/upload/` with `type=post` (§3.10, 25MB cap), then pass the returned
 * descriptors in `files`. Keeping the transfer out of post creation means a failed
 * upload never costs the user their draft, and a retry does not repost.
 */

import { Router, type Request } from "express";
import { z } from "zod";
import { NotificationType, Prisma, type PostCategory, type PostType, type PostVisibility } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { postInclude, commentInclude, serializeComment, serializePost } from "../serializers/post.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { resolveSphereId } from "../lib/sphereLookup.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { adjustPostImpact, applyImpactDelta, applyImpactEvent } from "../services/impact.js";
import { createNotification } from "../services/notifications.js";
import { resolveMentionedUsers } from "../lib/mentions.js";
import { postsVisibleTo } from "../lib/visibility.js";

export const postsRouter: Router = Router();

// No router-level requireAuth: the feed and post detail are readable anonymously
// (API_CONTRACT §3.4 marks them "—/U"), matching Django's IsAuthenticatedOrReadOnly.
// Anonymous callers see public posts only. Every mutating route gates individually.

const VISIBILITIES = ["public", "sphere", "friends"] as const;
const CATEGORIES = ["general", "academic", "event", "marketplace", "help", "announcement"] as const;
const TYPES = ["text", "cours", "td_tp", "exam", "project", "resource", "other"] as const;

/**
 * Visibility rules live in lib/visibility.ts so the search endpoint applies the
 * identical predicate — see the note there on why a second copy is a leak waiting
 * to happen.
 */
const visibleToUser = postsVisibleTo;

/** Per-viewer flags for a page of posts, fetched in bulk to avoid N+1. */
async function decorate(posts: Array<{ id: number; sphereId: number | null; authorId: number }>, viewerId: number) {
  const ids = posts.map((p) => p.id);
  const [likes, saves, ratings, comments, modSpheres] = await Promise.all([
    prisma.postLike.findMany({ where: { postId: { in: ids }, userId: viewerId }, select: { postId: true } }),
    prisma.postSave.findMany({ where: { postId: { in: ids }, userId: viewerId }, select: { postId: true } }),
    prisma.postImpactRating.findMany({
      where: { postId: { in: ids }, userId: viewerId },
      select: { postId: true, value: true },
    }),
    prisma.comment.findMany({
      where: { postId: { in: ids }, parentId: null },
      include: commentInclude,
      orderBy: { createdAt: "asc" },
    }),
    prisma.sphereMember.findMany({
      where: { userId: viewerId, status: "ACTIVE", role: { in: ["ADMIN", "MODERATOR"] } },
      select: { sphereId: true },
    }),
  ]);

  const moderated = new Set(modSpheres.map((m) => m.sphereId));
  const byPost = new Map<number, typeof comments>();
  for (const c of comments) {
    const bucket = byPost.get(c.postId) ?? [];
    if (bucket.length < 3) bucket.push(c); // recent_comments is capped at 3
    byPost.set(c.postId, bucket);
  }

  return {
    liked: new Set(likes.map((l) => l.postId)),
    saved: new Set(saves.map((s) => s.postId)),
    rating: new Map(ratings.map((r) => [r.postId, r.value])),
    recent: byPost,
    canDelete: (p: { sphereId: number | null; authorId: number }) =>
      p.authorId === viewerId || (p.sphereId !== null && moderated.has(p.sphereId)),
  };
}

function postIdOf(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Post not found.");
  return id;
}

/** Load a post the caller is allowed to see, or 404. */
async function loadVisiblePost(postId: number, viewerId: number | null) {
  const post = await prisma.post.findFirst({
    where: { AND: [{ id: postId }, await visibleToUser(viewerId)] },
    include: postInclude,
  });
  if (!post) throw notFound("Post not found.");
  return post;
}

// ── Feed ────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  content: z.string().min(1),
  sphere: z.number().int().positive().nullable().optional(),
  category: z.enum(CATEGORIES).default("general"),
  visibility: z.enum(VISIBILITIES).default("public"),
  subject: z.string().max(100).default(""),
  type: z.enum(TYPES).default("text"),
  audience: z.string().max(200).default(""),
  location: z.string().max(200).default(""),
  tags: z.array(z.string()).default([]),
  files: z.array(z.record(z.unknown())).default([]),
  allow_comments: z.boolean().default(true),
});

postsRouter.get("/", async (req, res) => {
  // Anonymous is allowed here and sees public posts only.
  const viewerId = req.user?.id ?? null;
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);
  const search = String(req.query.search ?? "").trim();

  const where: Prisma.PostWhereInput = {
    AND: [
      await visibleToUser(viewerId),
      ...(search ? [{ content: { contains: search, mode: "insensitive" as const } }] : []),
    ],
  };

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: postInclude,
      skip,
      take: pageSize,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  // Per-viewer flags are meaningless without a viewer, so the bulk lookups are
  // skipped entirely for anonymous callers rather than queried with a null id.
  const d = viewerId !== null ? await decorate(posts, viewerId) : null;
  list(
    res,
    posts.map((p) =>
      serializePost(p, {
        viewerId,
        isLiked: d?.liked.has(p.id) ?? false,
        isSaved: d?.saved.has(p.id) ?? false,
        userImpactRating: d?.rating.get(p.id) ?? null,
        canDelete: d?.canDelete(p) ?? false,
        recentComments: d?.recent.get(p.id) ?? [],
      }),
    ),
    paginate(total, page, pageSize),
  );
});

postsRouter.post("/", requireAuth, async (req, res) => {
  const input = createSchema.parse(req.body ?? {});
  const me = currentUser(req);

  if (input.sphere) {
    const membership = await prisma.sphereMember.findFirst({
      where: { sphereId: input.sphere, userId: me.id, status: "ACTIVE" },
    });
    if (!membership) throw badRequest("You must be a member of this sphere to post.", { sphere: ["Not a member."] });
  }

  const post = await prisma.post.create({
    data: {
      content: input.content,
      authorId: me.id,
      sphereId: input.sphere ?? null,
      category: input.category.toUpperCase() as PostCategory,
      visibility: input.visibility.toUpperCase() as PostVisibility,
      subject: input.subject,
      type: input.type.toUpperCase() as PostType,
      audience: input.audience,
      location: input.location,
      tags: input.tags,
      files: input.files as Prisma.InputJsonValue,
      allowComments: input.allow_comments,
    },
    include: postInclude,
  });

  // [CHANGE] Post creation awards nothing. Django awarded +1, contradicting
  // IMPACT_POLICY.md, which states the rule was removed so the score reflects
  // usefulness rather than volume.
  await applyImpactEvent(me.id, "POST_CREATED");

  for (const mentioned of await resolveMentionedUsers(post.content, me.id)) {
    await createNotification({
      type: NotificationType.MENTION_POST,
      title: "Vous avez été mentionné dans un post",
      message: `${post.author.firstName} ${post.author.lastName}`.trim() + " vous a mentionné dans un post",
      recipientId: mentioned.id,
      sender: { id: me.id, username: me.username, firstName: post.author.firstName, lastName: post.author.lastName, avatar: post.author.avatar },
      data: { post_id: String(post.id) },
    });
  }

  created(res, serializePost(post, { viewerId: me.id }));
});

// ── Filtered listings (before /:id/) ────────────────────────────────────────

postsRouter.get("/saved/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const [total, saves] = await Promise.all([
    prisma.postSave.count({ where: { userId: me.id } }),
    prisma.postSave.findMany({
      where: { userId: me.id },
      include: { post: { include: postInclude } },
      skip,
      take: pageSize,
      orderBy: { savedAt: "desc" },
    }),
  ]);

  const posts = saves.map((s) => s.post);
  const d = await decorate(posts, me.id);
  list(
    res,
    posts.map((p) =>
      serializePost(p, {
        viewerId: me.id,
        isLiked: d.liked.has(p.id),
        isSaved: true,
        userImpactRating: d.rating.get(p.id) ?? null,
        canDelete: d.canDelete(p),
        recentComments: d.recent.get(p.id) ?? [],
      }),
    ),
    paginate(total, page, pageSize),
  );
});

postsRouter.get("/sphere/:sphereId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const sphereId = await resolveSphereId(req.params.sphereId);

  const membership = await prisma.sphereMember.findFirst({
    where: { sphereId, userId: me.id, status: "ACTIVE" },
  });
  if (!membership) throw forbidden("You must be a member of this sphere to view posts.");

  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);
  const [total, posts] = await Promise.all([
    prisma.post.count({ where: { sphereId } }),
    prisma.post.findMany({
      where: { sphereId },
      include: postInclude,
      skip,
      take: pageSize,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const d = await decorate(posts, me.id);
  list(
    res,
    posts.map((p) =>
      serializePost(p, {
        viewerId: me.id,
        isLiked: d.liked.has(p.id),
        isSaved: d.saved.has(p.id),
        userImpactRating: d.rating.get(p.id) ?? null,
        canDelete: d.canDelete(p),
        recentComments: d.recent.get(p.id) ?? [],
      }),
    ),
    paginate(total, page, pageSize),
  );
});

postsRouter.get("/user/:userId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) throw notFound("User not found.");
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.PostWhereInput = { AND: [{ authorId: userId }, await visibleToUser(me.id)] };
  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({ where, include: postInclude, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
  ]);

  const d = await decorate(posts, me.id);
  list(
    res,
    posts.map((p) =>
      serializePost(p, {
        viewerId: me.id,
        isLiked: d.liked.has(p.id),
        isSaved: d.saved.has(p.id),
        userImpactRating: d.rating.get(p.id) ?? null,
        canDelete: d.canDelete(p),
        recentComments: d.recent.get(p.id) ?? [],
      }),
    ),
    paginate(total, page, pageSize),
  );
});

// ── Comment detail (before /:id/ so `comments` is not read as an id) ────────

function commentIdOf(req: Request): number {
  const id = Number(req.params.commentId);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Comment not found.");
  return id;
}

postsRouter.get("/comments/:commentId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const comment = await prisma.comment.findUnique({
    where: { id: commentIdOf(req) },
    include: commentInclude,
  });
  if (!comment) throw notFound("Comment not found.");

  await loadVisiblePost(comment.postId, me.id);
  ok(res, serializeComment(comment, { viewerId: me.id }));
});

const commentUpdateSchema = z.object({ content: z.string().min(1) });

async function updateComment(req: Request, res: import("express").Response) {
  const me = currentUser(req);
  const comment = await prisma.comment.findUnique({ where: { id: commentIdOf(req) } });
  if (!comment) throw notFound("Comment not found.");
  if (comment.authorId !== me.id) throw forbidden("You can only edit your own comments.");

  const { content } = commentUpdateSchema.parse(req.body ?? {});
  const updated = await prisma.comment.update({
    where: { id: comment.id },
    data: { content },
    include: commentInclude,
  });
  ok(res, serializeComment(updated, { viewerId: me.id }));
}

postsRouter.put("/comments/:commentId/", requireAuth, updateComment);
postsRouter.patch("/comments/:commentId/", requireAuth, updateComment);

postsRouter.delete("/comments/:commentId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const comment = await prisma.comment.findUnique({ where: { id: commentIdOf(req) } });
  if (!comment) throw notFound("Comment not found.");
  if (comment.authorId !== me.id) throw forbidden("You can only delete your own comments.");

  await prisma.$transaction([
    prisma.comment.delete({ where: { id: comment.id } }),
    prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    }),
  ]);
  res.status(204).send();
});

postsRouter.post("/comments/:commentId/like/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const commentId = commentIdOf(req);

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw notFound("Comment not found.");
  await loadVisiblePost(comment.postId, me.id);

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId: me.id } },
  });

  let liked = !existing;
  if (existing) {
    try {
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId: me.id } } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { decrement: 1 } } }),
      ]);
      liked = false;
    } catch (error: any) {
      if (error?.code === "P2025") liked = false;
      else throw error;
    }
  } else {
    try {
      await prisma.$transaction([
        prisma.commentLike.create({ data: { commentId, userId: me.id } }),
        prisma.comment.update({ where: { id: commentId }, data: { likesCount: { increment: 1 } } }),
      ]);
      liked = true;
    } catch (error: any) {
      if (error?.code === "P2002") liked = true;
      else throw error;
    }
  }

  const fresh = await prisma.comment.findUniqueOrThrow({ where: { id: commentId }, select: { likesCount: true } });
  ok(res, { liked, likesCount: Math.max(0, fresh.likesCount) });
});

// ── Post detail ─────────────────────────────────────────────────────────────

const updateSchema = createSchema.partial().omit({ sphere: true });

postsRouter.get("/:id/", async (req, res) => {
  const viewerId = req.user?.id ?? null;
  const post = await loadVisiblePost(postIdOf(req), viewerId);
  const d = viewerId !== null ? await decorate([post], viewerId) : null;

  ok(
    res,
    serializePost(post, {
      viewerId,
      isLiked: d?.liked.has(post.id) ?? false,
      isSaved: d?.saved.has(post.id) ?? false,
      userImpactRating: d?.rating.get(post.id) ?? null,
      canDelete: d?.canDelete(post) ?? false,
      recentComments: d?.recent.get(post.id) ?? [],
    }),
  );
});

async function updatePost(req: Request, res: import("express").Response) {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);
  if (post.authorId !== me.id) throw forbidden("You can only edit your own posts.");

  const input = updateSchema.parse(req.body ?? {});
  const data: Prisma.PostUpdateInput = {};
  if (input.content !== undefined) data.content = input.content;
  if (input.category !== undefined) data.category = input.category.toUpperCase() as PostCategory;
  if (input.visibility !== undefined) data.visibility = input.visibility.toUpperCase() as PostVisibility;
  if (input.subject !== undefined) data.subject = input.subject;
  if (input.type !== undefined) data.type = input.type.toUpperCase() as PostType;
  if (input.audience !== undefined) data.audience = input.audience;
  if (input.location !== undefined) data.location = input.location;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.files !== undefined) data.files = input.files as Prisma.InputJsonValue;
  if (input.allow_comments !== undefined) data.allowComments = input.allow_comments;

  const updated = await prisma.post.update({ where: { id: post.id }, data, include: postInclude });
  ok(res, serializePost(updated, { viewerId: me.id }));
}

postsRouter.put("/:id/", requireAuth, updatePost);
postsRouter.patch("/:id/", requireAuth, updatePost);

postsRouter.delete("/:id/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);

  let allowed = post.authorId === me.id;
  if (!allowed && post.sphereId) {
    const mod = await prisma.sphereMember.findFirst({
      where: { sphereId: post.sphereId, userId: me.id, status: "ACTIVE", role: { in: ["ADMIN", "MODERATOR"] } },
    });
    allowed = Boolean(mod);
  }
  if (!allowed) throw forbidden("You don't have permission to delete this post.");

  await prisma.post.delete({ where: { id: post.id } });
  res.status(204).send();
});

// ── Interactions ────────────────────────────────────────────────────────────

postsRouter.post("/:id/like/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: post.id, userId: me.id } },
  });

  let liked = !existing;
  if (existing) {
    try {
      await prisma.$transaction([
        prisma.postLike.delete({ where: { postId_userId: { postId: post.id, userId: me.id } } }),
        prisma.post.update({ where: { id: post.id }, data: { likesCount: { decrement: 1 } } }),
      ]);
      liked = false;
    } catch (error: any) {
      if (error?.code === "P2025") liked = false;
      else throw error;
    }
  } else {
    try {
      await prisma.$transaction([
        prisma.postLike.create({ data: { postId: post.id, userId: me.id } }),
        prisma.post.update({ where: { id: post.id }, data: { likesCount: { increment: 1 } } }),
      ]);
      liked = true;

      const liker = await prisma.user.findUniqueOrThrow({
        where: { id: me.id },
        select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
      });
      await createNotification({
        type: NotificationType.POST_LIKE,
        title: "Nouveau like sur votre post",
        message: `${liker.firstName} ${liker.lastName}`.trim() + " a aimé votre post",
        recipientId: post.authorId,
        sender: liker,
        data: { post_id: String(post.id) },
      });
    } catch (error: any) {
      if (error?.code === "P2002") liked = true;
      else throw error;
    }
  }

  const fresh = await prisma.post.findUniqueOrThrow({ where: { id: post.id }, select: { likesCount: true } });
  ok(res, { liked, likesCount: Math.max(0, fresh.likesCount) });
});

postsRouter.post("/:id/save/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);

  const existing = await prisma.postSave.findUnique({
    where: { postId_userId: { postId: post.id, userId: me.id } },
  });

  let saved = !existing;
  if (existing) {
    try {
      await prisma.postSave.delete({ where: { postId_userId: { postId: post.id, userId: me.id } } });
      saved = false;
    } catch (error: any) {
      if (error?.code === "P2025") saved = false;
      else throw error;
    }
  } else {
    try {
      await prisma.postSave.create({ data: { postId: post.id, userId: me.id } });
      saved = true;
    } catch (error: any) {
      if (error?.code === "P2002") saved = true;
      else throw error;
    }
  }

  ok(res, { saved });
});

const reportSchema = z.object({
  reason: z.string().max(120).default("inappropriate_content"),
  details: z.string().default(""),
});

postsRouter.post("/:id/report/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);
  const input = reportSchema.parse(req.body ?? {});

  const existing = await prisma.postReport.findUnique({
    where: { postId_reporterId: { postId: post.id, reporterId: me.id } },
  });

  const report = await prisma.postReport.upsert({
    where: { postId_reporterId: { postId: post.id, reporterId: me.id } },
    create: { postId: post.id, reporterId: me.id, reason: input.reason, details: input.details, status: "PENDING" },
    update: { reason: input.reason, details: input.details, status: "PENDING" },
  });

  const payload = { reported: true, report_id: report.id, is_new: !existing };
  if (existing) ok(res, payload);
  else created(res, payload);
});

const impactRateSchema = z.object({ value: z.number().int().min(1).max(5).nullable() });

postsRouter.post("/:id/impact-rate/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);
  const { value } = impactRateSchema.parse(req.body ?? {});

  const existing = await prisma.postImpactRating.findUnique({
    where: { postId_userId: { postId: post.id, userId: me.id } },
  });
  const previous = existing?.value ?? 0;

  // The author's score moves by the delta, so re-rating replaces rather than
  // stacks and removing a rating subtracts it.
  const delta = (value ?? 0) - previous;

  // Three statements, no reads: the post's score is the sum of its ratings, so it
  // moves by the same delta as the author's. An earlier version re-aggregated
  // inside the transaction and blew Prisma's 5s interactive-transaction timeout on
  // a remote database, failing the write intermittently.
  await prisma.$transaction(
    async (tx) => {
      if (value === null) {
        if (existing) await tx.postImpactRating.delete({ where: { id: existing.id } });
      } else {
        await tx.postImpactRating.upsert({
          where: { postId_userId: { postId: post.id, userId: me.id } },
          create: { postId: post.id, userId: me.id, value },
          update: { value },
        });
      }
      await applyImpactDelta(post.authorId, delta, tx);
      await adjustPostImpact(post.id, delta, tx);
    },
    // Headroom for latency spikes; the work itself is three fast statements.
    { timeout: 15_000 },
  );

  const fresh = await prisma.post.findUniqueOrThrow({ where: { id: post.id }, select: { impactScore: true } });
  ok(res, {
    impactScore: fresh.impactScore,
    userImpactRating: value,
    message: value === null ? "Impact rating removed" : "Impact rating saved",
  });
});

postsRouter.post("/:id/pin/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);

  if (!post.sphereId) throw badRequest("Only sphere posts can be pinned.");
  const mod = await prisma.sphereMember.findFirst({
    where: { sphereId: post.sphereId, userId: me.id, status: "ACTIVE", role: { in: ["ADMIN", "MODERATOR"] } },
  });
  if (!mod) throw forbidden("Only sphere moderators and admins can pin posts.");

  const updated = await prisma.post.update({
    where: { id: post.id },
    data: { isPinned: !post.isPinned },
    select: { isPinned: true },
  });
  ok(res, { isPinned: updated.isPinned, message: updated.isPinned ? "Post pinned" : "Post unpinned" });
});

// ── Comments on a post ──────────────────────────────────────────────────────

postsRouter.get("/:id/comments/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.CommentWhereInput = { postId: post.id, parentId: null };
  const [total, comments] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      include: { ...commentInclude, replies: { include: commentInclude, orderBy: { createdAt: "asc" }, take: 5 } },
      skip,
      take: pageSize,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const likedRows = await prisma.commentLike.findMany({
    where: { userId: me.id, comment: { postId: post.id } },
    select: { commentId: true },
  });
  const liked = new Set(likedRows.map((l) => l.commentId));

  list(
    res,
    comments.map((c) =>
      serializeComment(c, { viewerId: me.id, isLiked: liked.has(c.id), replies: c.replies, replyLikes: liked }),
    ),
    paginate(total, page, pageSize),
  );
});

const commentCreateSchema = z.object({
  content: z.string().min(1),
  parent: z.number().int().positive().nullable().optional(),
});

postsRouter.post("/:id/comments/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const post = await loadVisiblePost(postIdOf(req), me.id);
  if (!post.allowComments) throw badRequest("Comments are not allowed on this post.");

  const input = commentCreateSchema.parse(req.body ?? {});
  if (input.parent) {
    const parent = await prisma.comment.findUnique({ where: { id: input.parent }, select: { postId: true } });
    if (!parent || parent.postId !== post.id) {
      throw badRequest("Parent comment must belong to the same post.", { parent: ["Wrong post."] });
    }
  }

  const comment = await prisma.comment.create({
    data: { content: input.content, postId: post.id, authorId: me.id, parentId: input.parent ?? null },
    include: commentInclude,
  });
  await prisma.post.update({ where: { id: post.id }, data: { commentsCount: { increment: 1 } } });

  // Comment creation is worth 0 impact points — unchanged from Django, and
  // consistent with IMPACT_POLICY.md.
  await applyImpactEvent(me.id, "COMMENT_CREATED");

  const sender = {
    id: me.id,
    username: me.username,
    firstName: comment.author.firstName,
    lastName: comment.author.lastName,
    avatar: comment.author.avatar,
  };

  await createNotification({
    type: input.parent ? NotificationType.COMMENT_REPLY : NotificationType.POST_COMMENT,
    title: input.parent ? "Nouvelle réponse à votre commentaire" : "Nouveau commentaire sur votre post",
    message: `${sender.firstName} ${sender.lastName}`.trim() + (input.parent ? " a répondu à votre commentaire" : " a commenté votre post"),
    recipientId: post.authorId,
    sender,
    data: { post_id: String(post.id), comment_id: String(comment.id) },
  });

  for (const mentioned of await resolveMentionedUsers(comment.content, me.id)) {
    await createNotification({
      type: NotificationType.MENTION_COMMENT,
      title: "Vous avez été mentionné dans un commentaire",
      message: `${sender.firstName} ${sender.lastName}`.trim() + " vous a mentionné dans un commentaire",
      recipientId: mentioned.id,
      sender,
      data: { post_id: String(post.id), comment_id: String(comment.id) },
    });
  }

  created(res, serializeComment(comment, { viewerId: me.id }));
});
