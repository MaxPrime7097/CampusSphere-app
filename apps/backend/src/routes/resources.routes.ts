import { parseSlugId } from "../lib/hashids.js";
/**
 * Resources and folders — mounted at /api/resources/. API_CONTRACT §3.5.
 *
 * @status ACTIVE  / <id>/ <id>/download/ <id>/preview/ <id>/save/ <id>/report/
 * @status ACTIVE  <id>/share/ saved/ user/<id>/ folders/ folders/<id>/ folders/<id>/download/
 * @status UNUSED  <id>/view/  sphere/<id>/
 */

import { Router, type Request } from "express";
import { z } from "zod";
import { ZipArchive } from "archiver";
import { Prisma, type ResourceType, type ResourceVisibility } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { resourceInclude, serializeFolder, serializeResource } from "../serializers/resource.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { resolveSphereId } from "../lib/sphereLookup.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { applyImpactEvent } from "../services/impact.js";
import { keyFromUrl, storage } from "../services/storage.js";
import { parseJsonField, singleUpload } from "../middleware/upload.js";
import { friendIds, resourcesVisibleTo } from "../lib/visibility.js";
import { httpCache, autoInvalidate } from "../lib/cache.js";

export const resourcesRouter: Router = Router();
resourcesRouter.use(autoInvalidate("resources"));

// No router-level requireAuth. API_CONTRACT §3.5 marks the list "—/U" and detail,
// download and preview "visibility" — all readable anonymously, where anonymous
// resolves to public-only. Mutating routes gate individually.

const MAX_FOLDERS_PER_USER = 4;
const MAX_RESOURCES_PER_FOLDER = 20;

/** All accepted type strings — both legacy DB values and new frontend canonical keys. */
const TYPES = [
  // Legacy DB values (still returned by serializer)
  "cours", "notes", "resumes", "exercises", "projects", "presentations", "exam_papers", "other",
  // New frontend canonical keys
  "course_notes", "td_tp", "exams", "project", "book",
] as const;
const VISIBILITIES = ["public", "university", "friends"] as const;

/** Django accepted `private` as a synonym for `friends`; preserved on write. */
function normaliseVisibility(value: string | undefined): ResourceVisibility {
  const v = (value ?? "public").toLowerCase();
  if (v === "private") return "FRIENDS";
  if (!VISIBILITIES.includes(v as (typeof VISIBILITIES)[number])) return "PUBLIC";
  return v.toUpperCase() as ResourceVisibility;
}

/**
 * Visibility rules live in lib/visibility.ts so the search endpoint applies the
 * identical predicate — see the note there on why a second copy is a leak waiting
 * to happen.
 */
const visibleToUser = resourcesVisibleTo;

async function loadVisibleResource(idOrReq: number | Request, viewerId: number | null) {
  const id = typeof idOrReq === "number" ? idOrReq : await resourceIdOf(idOrReq);
  const resource = await prisma.resource.findFirst({
    where: { AND: [{ id }, await visibleToUser(viewerId)] },
    include: resourceInclude,
  });
  if (!resource) throw notFound("Resource not found.");
  return resource;
}

async function savedIds(resourceIds: number[], userId: number): Promise<Set<number>> {
  const rows = await prisma.resourceSave.findMany({
    where: { resourceId: { in: resourceIds }, userId },
    select: { resourceId: true },
  });
  return new Set(rows.map((r) => r.resourceId));
}

async function resourceIdOf(req: Request): Promise<number> {
  const raw = String(req.params.id ?? "").trim();
  if (!raw) throw notFound("Resource not found.");

  const parsed = parseSlugId(raw);
  if (parsed && Number.isInteger(parsed) && parsed > 0) return parsed;

  const cleaned = raw.replace(/-/g, " ");
  const resource = await prisma.resource.findFirst({
    where: {
      OR: [
        { title: { equals: cleaned, mode: "insensitive" } },
        { title: { contains: cleaned, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (resource) return resource.id;
  throw notFound("Resource not found.");
}

// ── Folders (before /:id/ so `folders` is not read as an id) ────────────────

const folderCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(300).default(""),
  visibility: z.enum(VISIBILITIES).default("public"),
});

resourcesRouter.get("/folders/", requireAuth, httpCache({ namespace: "resources", ttlSeconds: 60 }), async (req, res) => {
  const me = currentUser(req);
  const folders = await prisma.resourceFolder.findMany({
    where: { ownerId: me.id },
    include: { _count: { select: { resources: true } } },
    orderBy: { name: "asc" },
  });
  list(res, folders.map((f) => serializeFolder(f, me.id)));
});

resourcesRouter.post("/folders/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const input = folderCreateSchema.parse(req.body ?? {});

  const count = await prisma.resourceFolder.count({ where: { ownerId: me.id } });
  if (count >= MAX_FOLDERS_PER_USER) {
    throw badRequest(`You have reached the limit of ${MAX_FOLDERS_PER_USER} folders.`);
  }

  const duplicate = await prisma.resourceFolder.findFirst({
    where: { ownerId: me.id, name: { equals: input.name, mode: "insensitive" } },
  });
  if (duplicate) throw conflict("A folder with this name already exists.", { name: ["Already used."] });

  const folder = await prisma.resourceFolder.create({
    data: {
      ownerId: me.id,
      name: input.name,
      description: input.description,
      visibility: normaliseVisibility(input.visibility),
    },
    include: { _count: { select: { resources: true } } },
  });
  created(res, serializeFolder(folder, me.id));
});

/** Folder access mirrors resource visibility, keyed on the owner. */
async function canAccessFolder(folder: { ownerId: number; visibility: ResourceVisibility }, viewerId: number): Promise<boolean> {
  if (folder.visibility === "PUBLIC" || folder.ownerId === viewerId) return true;

  if (folder.visibility === "UNIVERSITY") {
    const [viewer, owner] = await Promise.all([
      prisma.user.findUnique({ where: { id: viewerId }, select: { university: true } }),
      prisma.user.findUnique({ where: { id: folder.ownerId }, select: { university: true } }),
    ]);
    return Boolean(viewer?.university && viewer.university === owner?.university);
  }

  return (await friendIds(viewerId)).includes(folder.ownerId);
}

function folderIdOf(req: Request): number {
  const id = Number(req.params.folderId);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Folder not found.");
  return id;
}

resourcesRouter.get("/folders/:folderId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const folder = await prisma.resourceFolder.findUnique({
    where: { id: folderIdOf(req) },
    include: { _count: { select: { resources: true } } },
  });
  if (!folder) throw notFound("Folder not found.");
  if (!(await canAccessFolder(folder, me.id))) throw notFound("Folder not found.");

  const resources = await prisma.resource.findMany({
    where: { folderId: folder.id },
    include: resourceInclude,
    orderBy: { createdAt: "desc" },
  });
  const saved = await savedIds(resources.map((r) => r.id), me.id);

  ok(res, {
    ...serializeFolder(folder, me.id),
    resources: resources.map((r) => serializeResource(r, { viewerId: me.id, isSaved: saved.has(r.id) })),
  });
});

async function updateFolder(req: Request, res: import("express").Response) {
  const me = currentUser(req);
  const folder = await prisma.resourceFolder.findFirst({
    where: { id: folderIdOf(req), ownerId: me.id },
  });
  if (!folder) throw notFound("Folder not found.");

  const input = folderCreateSchema.partial().parse(req.body ?? {});

  if (input.name && input.name.toLowerCase() !== folder.name.toLowerCase()) {
    const duplicate = await prisma.resourceFolder.findFirst({
      where: { ownerId: me.id, name: { equals: input.name, mode: "insensitive" }, NOT: { id: folder.id } },
    });
    if (duplicate) throw conflict("A folder with this name already exists.", { name: ["Already used."] });
  }

  const updated = await prisma.resourceFolder.update({
    where: { id: folder.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.visibility !== undefined ? { visibility: normaliseVisibility(input.visibility) } : {}),
    },
    include: { _count: { select: { resources: true } } },
  });
  ok(res, serializeFolder(updated, me.id));
}

resourcesRouter.put("/folders/:folderId/", requireAuth, updateFolder);
resourcesRouter.patch("/folders/:folderId/", requireAuth, updateFolder);

resourcesRouter.delete("/folders/:folderId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const folder = await prisma.resourceFolder.findFirst({
    where: { id: folderIdOf(req), ownerId: me.id },
  });
  if (!folder) throw notFound("Folder not found.");

  // Resources survive and lose their folder reference (schema onDelete: SetNull).
  await prisma.resourceFolder.delete({ where: { id: folder.id } });
  ok(res, null, "Folder deleted.");
});

resourcesRouter.get("/folders/:folderId/download/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const folder = await prisma.resourceFolder.findUnique({ where: { id: folderIdOf(req) } });
  if (!folder) throw notFound("Folder not found.");
  if (!(await canAccessFolder(folder, me.id))) throw forbidden("You do not have access to this folder.");

  const resources = await prisma.resource.findMany({ where: { folderId: folder.id } });
  if (resources.length === 0) throw badRequest("This folder is empty.");

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${folder.name.replace(/[^\w.-]+/g, "_")}.zip"`);

  // The archiver package resolves to a namespace of classes here, not the callable
  // factory its README shows, so the class is instantiated directly.
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (err: Error) => {
    console.error("[resources] zip stream failed", err);
    res.destroy();
  });
  archive.pipe(res);

  // Deduplicate filenames so two resources with the same title do not collide.
  const used = new Map<string, number>();
  for (const resource of resources) {
    const key = resource.storageKey ?? keyFromUrl(resource.fileUrl);
    if (!key) continue;
    try {
      const buffer = await storage.get(key);
      let name = resource.title.replace(/[/\\]/g, "_");
      const seen = used.get(name);
      if (seen !== undefined) {
        used.set(name, seen + 1);
        name = `${name}_${seen + 1}`;
      } else {
        used.set(name, 0);
      }
      archive.append(buffer, { name });
    } catch (error) {
      console.warn(`[resources] skipping unreadable object for resource ${resource.id}`, error);
    }
  }

  await archive.finalize();
});

// ── Filtered listings ───────────────────────────────────────────────────────

resourcesRouter.get("/saved/", requireAuth, httpCache({ namespace: "resources", ttlSeconds: 60 }), async (req, res) => {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const [total, saves] = await Promise.all([
    prisma.resourceSave.count({ where: { userId: me.id } }),
    prisma.resourceSave.findMany({
      where: { userId: me.id },
      include: { resource: { include: resourceInclude } },
      skip,
      take: pageSize,
      orderBy: { savedAt: "desc" },
    }),
  ]);

  list(
    res,
    saves.map((s) => serializeResource(s.resource, { viewerId: me.id, isSaved: true })),
    paginate(total, page, pageSize),
  );
});

resourcesRouter.get("/user/:userId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) throw notFound("User not found.");
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.ResourceWhereInput = {
    AND: [{ authorId: userId }, await visibleToUser(me.id)],
  };
  const [total, resources] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({ where, include: resourceInclude, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
  ]);
  const saved = await savedIds(resources.map((r) => r.id), me.id);

  list(
    res,
    resources.map((r) => serializeResource(r, { viewerId: me.id, isSaved: saved.has(r.id) })),
    paginate(total, page, pageSize),
  );
});

resourcesRouter.get("/sphere/:sphereId/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const sphereId = await resolveSphereId(req.params.sphereId);

  const membership = await prisma.sphereMember.findFirst({
    where: { sphereId, userId: me.id, status: "ACTIVE" },
  });
  if (!membership) throw forbidden("You must be a member of this sphere.");

  // [CHANGE] Returns SphereFile, not Resource. Django filtered Resource by a
  // `sphere` column that never existed, so this route always 500'd.
  const files = await prisma.sphereFile.findMany({
    where: { sphereId },
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

// ── List / create ───────────────────────────────────────────────────────────

resourcesRouter.get("/", httpCache({ namespace: "resources", ttlSeconds: 60 }), async (req, res) => {
  const viewerId = req.user?.id ?? null;
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);
  const search = String(req.query.search ?? "").trim();

  const where: Prisma.ResourceWhereInput = {
    AND: [
      await visibleToUser(viewerId),
      ...(search
        ? [{ OR: [{ title: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] }]
        : []),
    ],
  };

  const [total, resources] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({ where, include: resourceInclude, skip, take: pageSize, orderBy: { createdAt: "desc" } }),
  ]);
  const saved = viewerId !== null ? await savedIds(resources.map((r) => r.id), viewerId) : new Set<number>();

  list(
    res,
    resources.map((r) => serializeResource(r, { viewerId, isSaved: saved.has(r.id) })),
    paginate(total, page, pageSize),
  );
});

resourcesRouter.post("/", requireAuth, singleUpload("file", "resource"), async (req, res) => {
  const me = currentUser(req);
  const file = req.file;
  if (!file) throw badRequest("A file is required.", { file: ["This field is required."] });

  const body = req.body as Record<string, string>;
  const title = (body.title ?? file.originalname).trim();
  if (!title) throw badRequest("A title is required.", { title: ["This field is required."] });

  const rawType = (body.type ?? "other").toLowerCase();
  const type = (TYPES.includes(rawType as (typeof TYPES)[number]) ? rawType : "other").toUpperCase() as ResourceType;

  const folderId = body.folder_id ? Number(body.folder_id) : null;
  if (folderId) {
    const folder = await prisma.resourceFolder.findFirst({ where: { id: folderId, ownerId: me.id } });
    if (!folder) throw badRequest("Folder not found or not owned by you.", { folder_id: ["Invalid folder."] });

    const count = await prisma.resource.count({ where: { folderId } });
    if (count >= MAX_RESOURCES_PER_FOLDER) {
      throw badRequest(`This folder has reached the limit of ${MAX_RESOURCES_PER_FOLDER} files.`, {
        folder_id: ["Folder is full."],
      });
    }
  }

  const stored = await storage.put({
    buffer: file.buffer,
    originalName: file.originalname,
    contentType: file.mimetype,
    prefix: "resources",
  });

  const resource = await prisma.resource.create({
    data: {
      title,
      description: body.description ?? "",
      authorId: me.id,
      fileUrl: stored.url,
      storageKey: stored.key,
      fileSize: stored.size,
      fileType: stored.contentType,
      subject: body.subject || "other",
      type,
      visibility: normaliseVisibility(body.visibility),
      audience: body.audience ?? "",
      tags: parseJsonField<string[]>(body.tags, []),
      folderId,
    },
    include: resourceInclude,
  });

  // Resource upload is the one event still worth +5 — IMPACT_POLICY.md.
  await applyImpactEvent(me.id, "RESOURCE_UPLOADED");

  created(res, serializeResource(resource, { viewerId: me.id }));
});

// ── Detail ──────────────────────────────────────────────────────────────────

resourcesRouter.get("/:id/", httpCache({ namespace: "resources", ttlSeconds: 60 }), async (req, res) => {
  const viewerId = req.user?.id ?? null;
  const resource = await loadVisibleResource(req, viewerId);

  // A first view by a signed-in non-author increments the counter once. Views are
  // keyed on a user, so anonymous reads are not counted.
  if (viewerId !== null && resource.authorId !== viewerId) {
    const view = await prisma.resourceView.findUnique({
      where: { resourceId_userId: { resourceId: resource.id, userId: viewerId } },
    });
    if (!view) {
      await prisma.$transaction([
        prisma.resourceView.create({ data: { resourceId: resource.id, userId: viewerId } }),
        prisma.resource.update({ where: { id: resource.id }, data: { viewsCount: { increment: 1 } } }),
      ]);
      resource.viewsCount += 1;
    }
  }

  const saved = viewerId !== null ? await savedIds([resource.id], viewerId) : new Set<number>();
  ok(res, serializeResource(resource, { viewerId, isSaved: saved.has(resource.id) }));
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  subject: z.string().max(100).optional(),
  type: z.enum(TYPES).optional(),
  visibility: z.enum([...VISIBILITIES, "private"]).optional(),
  audience: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.number().int().positive().nullable().optional(),
});

async function updateResource(req: Request, res: import("express").Response) {
  const me = currentUser(req);
  const resource = await loadVisibleResource(req, me.id);
  if (resource.authorId !== me.id) throw forbidden("You can only edit your own resources.");

  const input = updateSchema.parse(req.body ?? {});

  if (input.folder_id) {
    const folder = await prisma.resourceFolder.findFirst({ where: { id: input.folder_id, ownerId: me.id } });
    if (!folder) throw badRequest("Folder not found or not owned by you.", { folder_id: ["Invalid folder."] });
    if (resource.folderId !== input.folder_id) {
      const count = await prisma.resource.count({ where: { folderId: input.folder_id } });
      if (count >= MAX_RESOURCES_PER_FOLDER) {
        throw badRequest(`This folder has reached the limit of ${MAX_RESOURCES_PER_FOLDER} files.`);
      }
    }
  }

  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.type !== undefined ? { type: input.type.toUpperCase() as ResourceType } : {}),
      ...(input.visibility !== undefined ? { visibility: normaliseVisibility(input.visibility) } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.folder_id !== undefined ? { folderId: input.folder_id } : {}),
    },
    include: resourceInclude,
  });
  ok(res, serializeResource(updated, { viewerId: me.id }));
}

resourcesRouter.put("/:id/", requireAuth, updateResource);
resourcesRouter.patch("/:id/", requireAuth, updateResource);

resourcesRouter.delete("/:id/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const resource = await loadVisibleResource(req, me.id);
  if (resource.authorId !== me.id) throw forbidden("You can only delete your own resources.");

  await prisma.resource.delete({ where: { id: resource.id } });

  // Best-effort: a stranded object is preferable to failing the delete the user asked for.
  const key = resource.storageKey ?? keyFromUrl(resource.fileUrl);
  if (key) await storage.delete(key).catch((e) => console.warn("[resources] object delete failed", e));

  res.status(204).send();
});

// ── Interactions ────────────────────────────────────────────────────────────

resourcesRouter.post("/:id/download/", async (req, res) => {
  const resource = await loadVisibleResource(req, req.user?.id ?? null);

  const fileExt = resource.fileUrl ? resource.fileUrl.split(".").pop()?.split("?")[0] : "";
  let filename = resource.title.replace(/[^\w.-]+/g, "_");
  if (fileExt && !filename.toLowerCase().endsWith(`.${fileExt.toLowerCase()}`)) {
    filename += `.${fileExt}`;
  }

  const key = resource.storageKey ?? keyFromUrl(resource.fileUrl);
  let buffer: Buffer | null = null;
  if (key) {
    try {
      buffer = await storage.get(key);
    } catch {
      buffer = null;
    }
  }

  if (!buffer && resource.fileUrl && (resource.fileUrl.startsWith("http://") || resource.fileUrl.startsWith("https://"))) {
    try {
      const resp = await fetch(resource.fileUrl);
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      }
    } catch {
      buffer = null;
    }
  }

  if (!buffer) {
    if (resource.fileUrl && (resource.fileUrl.startsWith("http://") || resource.fileUrl.startsWith("https://"))) {
      await prisma.resource.update({ where: { id: resource.id }, data: { downloadsCount: { increment: 1 } } });
      return res.redirect(resource.fileUrl);
    }
    throw notFound("File not found or corrupted.");
  }

  await prisma.resource.update({ where: { id: resource.id }, data: { downloadsCount: { increment: 1 } } });

  res.setHeader("Content-Type", resource.fileType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});

resourcesRouter.get("/:id/preview/", async (req, res) => {
  const resource = await loadVisibleResource(req, req.user?.id ?? null);
  ok(res, { preview_url: resource.fileUrl });
});

resourcesRouter.post("/:id/save/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const resource = await loadVisibleResource(req, me.id);

  const existing = await prisma.resourceSave.findUnique({
    where: { resourceId_userId: { resourceId: resource.id, userId: me.id } },
  });

  let saved = !existing;
  if (existing) {
    try {
      await prisma.$transaction([
        prisma.resourceSave.delete({ where: { resourceId_userId: { resourceId: resource.id, userId: me.id } } }),
        prisma.resource.update({ where: { id: resource.id }, data: { savesCount: { decrement: 1 } } }),
      ]);
      saved = false;
    } catch (error: any) {
      if (error?.code === "P2025") saved = false;
      else throw error;
    }
  } else {
    try {
      await prisma.$transaction([
        prisma.resourceSave.create({ data: { resourceId: resource.id, userId: me.id } }),
        prisma.resource.update({ where: { id: resource.id }, data: { savesCount: { increment: 1 } } }),
      ]);
      saved = true;
    } catch (error: any) {
      if (error?.code === "P2002") saved = true;
      else throw error;
    }
  }

  const fresh = await prisma.resource.findUniqueOrThrow({ where: { id: resource.id }, select: { savesCount: true } });
  ok(res, { saved, savesCount: Math.max(0, fresh.savesCount) });
});

resourcesRouter.post("/:id/view/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const resource = await loadVisibleResource(req, me.id);

  if (resource.authorId !== me.id) {
    const view = await prisma.resourceView.findUnique({
      where: { resourceId_userId: { resourceId: resource.id, userId: me.id } },
    });
    if (!view) {
      try {
        await prisma.$transaction([
          prisma.resourceView.create({ data: { resourceId: resource.id, userId: me.id } }),
          prisma.resource.update({ where: { id: resource.id }, data: { viewsCount: { increment: 1 } } }),
        ]);
      } catch (error: any) {
        if (error?.code !== "P2002") throw error;
      }
    }
  }

  const fresh = await prisma.resource.findUniqueOrThrow({ where: { id: resource.id }, select: { viewsCount: true } });
  ok(res, { viewsCount: fresh.viewsCount });
});

const reportSchema = z.object({
  reason: z.string().max(120).default("inappropriate_content"),
  details: z.string().default(""),
});

resourcesRouter.post("/:id/report/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const resource = await loadVisibleResource(req, me.id);
  if (resource.authorId === me.id) throw badRequest("You cannot report your own resource.");

  const input = reportSchema.parse(req.body ?? {});
  const existing = await prisma.resourceReport.findUnique({
    where: { resourceId_reporterId: { resourceId: resource.id, reporterId: me.id } },
  });

  const report = await prisma.resourceReport.upsert({
    where: { resourceId_reporterId: { resourceId: resource.id, reporterId: me.id } },
    create: { resourceId: resource.id, reporterId: me.id, reason: input.reason, details: input.details, status: "PENDING" },
    update: { reason: input.reason, details: input.details, status: "PENDING" },
  });

  const payload = { id: report.id, status: report.status.toLowerCase(), created: !existing };
  if (existing) ok(res, payload, "Resource report updated.");
  else created(res, payload, "Resource report submitted successfully.");
});

const shareSchema = z.object({ channel: z.string().max(40).default("copy_link") });

resourcesRouter.post("/:id/share/", async (req, res) => {
  // Analytics only, and public per the contract: the share event records a null
  // user when the sharer is anonymous.
  const viewerId = req.user?.id ?? null;
  const resource = await loadVisibleResource(req, viewerId);
  const { channel } = shareSchema.parse(req.body ?? {});

  await prisma.resourceShareEvent.create({
    data: {
      resourceId: resource.id,
      userId: viewerId,
      channel: channel === "copy_link" ? "COPY_LINK" : "UNKNOWN",
    },
  });
  created(res, null, "Share event recorded.");
});

const resourceImpactRateSchema = z.object({
  value: z.number().int().min(1).max(5).nullable(),
  previous: z.number().int().min(1).max(5).nullable().optional(),
});

resourcesRouter.post("/:id/impact-rate/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const resource = await loadVisibleResource(req, me.id);
  const { value, previous } = resourceImpactRateSchema.parse(req.body ?? {});

  const prevVal = previous ?? 0;
  const currVal = value ?? 0;
  const delta = currVal - prevVal;

  if (delta !== 0) {
    await prisma.$transaction([
      prisma.resource.update({
        where: { id: resource.id },
        data: { impactScore: { increment: delta } },
      }),
      prisma.user.update({
        where: { id: resource.authorId },
        data: { impactScore: { increment: delta } },
      }),
    ]);
  }

  const fresh = await prisma.resource.findUniqueOrThrow({
    where: { id: resource.id },
    select: { impactScore: true },
  });

  ok(res, {
    impactScore: Math.max(0, fresh.impactScore),
    userImpactRating: value,
    message: value === null ? "Impact rating removed" : "Impact rating saved",
  });
});
