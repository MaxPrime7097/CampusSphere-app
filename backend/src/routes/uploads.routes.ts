/**
 * File uploads — mounted at /api/. API_CONTRACT §3.10.
 *
 * Routes live at three prefixes (`/api/upload/`, `/api/uploads/`,
 * `/api/users/<id>/avatar|cover/`), which is why this router mounts at the API
 * root rather than under one segment. That layout is the Django app's, kept so no
 * client URL changes.
 *
 * Every byte goes to object storage, never the container filesystem — Render's
 * plan has no persistent disk, so a local write is deleted on the next deploy.
 *
 * @status ACTIVE   POST /api/upload/  POST /api/users/<id>/avatar/  .../cover/
 * @status UNUSED   GET·DELETE /api/upload/<uuid>/  GET /api/uploads/  /api/uploads/stats/
 */

import { Router } from "express";
import { UploadType, type Prisma, type UploadedFile } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { created, list, ok, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, forbidden, notFound, payloadTooLarge } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { MAX_SIZES, singleUpload, type UploadKind } from "../middleware/upload.js";
import { keyFromUrl, storage } from "../services/storage.js";
import { serializeUser, userSelect } from "../serializers/user.js";
import { loadUserCounts } from "../lib/userCounts.js";

export const uploadsRouter: Router = Router();

/**
 * `requireAuth` is attached per route, never as `uploadsRouter.use(requireAuth)`.
 *
 * This router is mounted at the API **root** so it can own three sibling prefixes.
 * Router-level middleware runs for every request that reaches the mount point —
 * including ones this router has no route for — so a blanket `use(requireAuth)`
 * here would 401 registration, login and every other public endpoint before their
 * own routers were ever consulted.
 */

/** Wire `type` value -> enum member + the middleware kind that caps it. */
const UPLOAD_KINDS: Record<string, { enum: UploadType; kind: UploadKind }> = {
  avatar: { enum: UploadType.AVATAR, kind: "avatar" },
  cover: { enum: UploadType.COVER, kind: "cover" },
  post: { enum: UploadType.POST, kind: "post" },
  resource: { enum: UploadType.RESOURCE, kind: "resource" },
  other: { enum: UploadType.OTHER, kind: "other" },
};

function serializeUpload(file: UploadedFile): Record<string, unknown> {
  return {
    id: file.id,
    url: file.fileUrl,
    file: file.fileUrl,
    file_url: file.fileUrl,
    original_name: file.originalName,
    file_type: file.fileType,
    file_size: file.fileSize,
    upload_type: file.uploadType.toLowerCase(),
    uploaded_by: file.uploadedById,
    is_processed: file.isProcessed,
    is_public: file.isPublic,
    uploaded_at: file.uploadedAt.toISOString(),
  };
}

interface PersistInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/** Store the bytes and record the row. */
async function persistUpload(
  file: PersistInput,
  uploadType: UploadType,
  uploadedById: number,
): Promise<UploadedFile> {
  const stored = await storage.put({
    buffer: file.buffer,
    originalName: file.originalname,
    contentType: file.mimetype,
    prefix: `uploads/${uploadType.toLowerCase()}`,
  });

  return prisma.uploadedFile.create({
    data: {
      fileUrl: stored.url,
      storageKey: stored.key,
      originalName: file.originalname,
      fileType: file.mimetype || "application/octet-stream",
      fileSize: file.size,
      uploadType,
      uploadedById,
      // Avatars and covers are rendered by any profile viewer, so they are public;
      // everything else inherits the visibility of whatever references it.
      isPublic: uploadType === UploadType.AVATAR || uploadType === UploadType.COVER,
    },
  });
}

// ── Generic upload ──────────────────────────────────────────────────────────

/**
 * POST /api/upload/
 *
 * `type` is a body field, but the size cap it selects has to be applied by multer
 * *before* the body is parsed. The upload is therefore admitted at the largest cap
 * (resource, 50MB) and the per-type cap enforced immediately after, so an oversized
 * avatar is still a 413 rather than a silent acceptance.
 */
const uploadHandler = async (req: Parameters<typeof currentUser>[0], res: Parameters<typeof created>[0]) => {
  const me = currentUser(req);
  const file = (req as { file?: PersistInput }).file;
  if (!file) throw badRequest("No file provided.");

  const requested = String((req.body as { type?: unknown }).type ?? "cover").trim().toLowerCase();
  const mapping = UPLOAD_KINDS[requested] || UPLOAD_KINDS.cover || UPLOAD_KINDS.other;

  const cap = MAX_SIZES[mapping.kind];
  if (file.size > cap) {
    throw payloadTooLarge(`File exceeds the ${Math.round(cap / 1024 / 1024)}MB limit for ${requested} uploads.`);
  }

  created(res, serializeUpload(await persistUpload(file, mapping.enum, me.id)), "File uploaded successfully");
};

uploadsRouter.post("/upload/", requireAuth, singleUpload("file", "resource"), uploadHandler);
uploadsRouter.post("/upload", requireAuth, singleUpload("file", "resource"), uploadHandler);
uploadsRouter.post("/uploads/image/", requireAuth, singleUpload("file", "resource"), uploadHandler);
uploadsRouter.post("/uploads/image", requireAuth, singleUpload("file", "resource"), uploadHandler);
uploadsRouter.post("/uploads/", requireAuth, singleUpload("file", "resource"), uploadHandler);

/** @status UNUSED — owner-scoped read. */
uploadsRouter.get("/upload/:id/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const file = await prisma.uploadedFile.findFirst({
    where: { id: String(req.params.id), uploadedById: me.id },
  });
  if (!file) throw notFound("File not found.");
  ok(res, serializeUpload(file));
});

/** @status UNUSED — deletes the stored object as well as the row. */
uploadsRouter.delete("/upload/:id/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const file = await prisma.uploadedFile.findFirst({
    where: { id: String(req.params.id), uploadedById: me.id },
  });
  if (!file) throw notFound("File not found.");

  const key = file.storageKey ?? keyFromUrl(file.fileUrl);
  // Storage first, then the row: an orphaned object is recoverable, an orphaned
  // row pointing at nothing is a broken image for the user.
  if (key) await storage.delete(key).catch((error: unknown) => console.error("[uploads] object delete failed", error));
  await prisma.uploadedFile.delete({ where: { id: file.id } });

  ok(res, null, "File deleted successfully");
});

// ── Listing ─────────────────────────────────────────────────────────────────

/** @status UNUSED — `getUserUploads` has no call site. */
uploadsRouter.get("/uploads/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.UploadedFileWhereInput = { uploadedById: me.id };
  const requested = String(req.query.type ?? "").trim().toLowerCase();
  if (requested) {
    const mapping = UPLOAD_KINDS[requested];
    if (!mapping) throw badRequest(`Unknown upload type '${requested}'.`);
    where.uploadType = mapping.enum;
  }

  const [rows, total] = await Promise.all([
    prisma.uploadedFile.findMany({ where, orderBy: { uploadedAt: "desc" }, skip, take: pageSize }),
    prisma.uploadedFile.count({ where }),
  ]);

  list(res, rows.map(serializeUpload), paginate(total, page, pageSize));
});

/**
 * @status UNUSED
 *
 * **[CHANGE]** Django's version called `models.Sum(...)` in a module that never
 * imported `models`, so every request raised `NameError` and returned 500. Nobody
 * noticed because `getUploadStats` has no call site.
 */
uploadsRouter.get("/uploads/stats/", requireAuth, async (req, res) => {
  const me = currentUser(req);

  const [aggregate, byType] = await Promise.all([
    prisma.uploadedFile.aggregate({
      where: { uploadedById: me.id },
      _count: { _all: true },
      _sum: { fileSize: true },
    }),
    prisma.uploadedFile.groupBy({
      by: ["uploadType"],
      where: { uploadedById: me.id },
      _count: { _all: true },
    }),
  ]);

  const totalSize = aggregate._sum.fileSize ?? 0;
  ok(res, {
    total_uploads: aggregate._count._all,
    total_size_bytes: totalSize,
    total_size_mb: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
    by_type: Object.fromEntries(byType.map((row) => [row.uploadType.toLowerCase(), row._count._all])),
  });
});

// ── Profile images ──────────────────────────────────────────────────────────

/**
 * Shared by the avatar and cover routes.
 *
 * Self-only: `<id>` must be the caller. Django returned 403 here, and that is kept
 * — unlike a private record, the existence of a user id is not a secret, so there
 * is nothing to hide behind a 404.
 */
function profileImageHandler(field: "avatar" | "coverPhoto", uploadType: UploadType, label: string) {
  return async (req: Parameters<typeof currentUser>[0], res: Parameters<typeof ok>[0]): Promise<void> => {
    const me = currentUser(req);
    const targetId = Number((req.params as { userId: string }).userId);
    if (!Number.isInteger(targetId)) throw notFound("User not found.");
    if (targetId !== me.id) throw forbidden(`You can only upload your own ${label}.`);

    const file = (req as { file?: PersistInput }).file;
    if (!file) throw badRequest("No file provided.");

    const uploaded = await persistUpload(file, uploadType, me.id);

    const previous = await prisma.user.findUnique({
      where: { id: me.id },
      select: { avatar: true, coverPhoto: true },
    });

    const user = await prisma.user.update({
      where: { id: me.id },
      data: field === "avatar" ? { avatar: uploaded.fileUrl } : { coverPhoto: uploaded.fileUrl },
      select: userSelect,
    });

    // Reclaim the old object. Best-effort: a storage hiccup must not fail an
    // upload that already succeeded.
    const previousUrl = field === "avatar" ? previous?.avatar : previous?.coverPhoto;
    if (previousUrl) {
      const key = keyFromUrl(previousUrl);
      if (key) await storage.delete(key).catch(() => undefined);
    }

    created(
      res,
      {
        file: serializeUpload(uploaded),
        [field === "avatar" ? "avatar_url" : "cover_photo_url"]: uploaded.fileUrl,
        user: serializeUser(user, { viewerId: me.id, counts: await loadUserCounts(me.id) }),
      },
      `${label} uploaded successfully`,
    );
  };
}

uploadsRouter.post(
  "/users/:userId/avatar/",
  requireAuth,
  singleUpload("file", "avatar"),
  profileImageHandler("avatar", UploadType.AVATAR, "Avatar"),
);

uploadsRouter.post(
  "/users/:userId/cover/",
  requireAuth,
  singleUpload("file", "cover"),
  profileImageHandler("coverPhoto", UploadType.COVER, "Cover photo"),
);
