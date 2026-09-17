/**
 * Sphera (AI study tools) — mounted at /api/sphera/ and /api/study/. API_CONTRACT §3.9.
 *
 * The `/api/study/` prefix is an alias, retained because `api.ts` still calls it
 * (see FE-06 in documentation/FRONTEND_CHANGES.md). Both prefixes serve the same
 * router; there is no second implementation to drift.
 *
 * Four defects from the Django original are fixed here, each marked [CHANGE] at
 * the site:
 *   1. `resource_id` XOR `sphere_file_id` — the two id spaces were conflated
 *   2. `sphere.memberships` → the accessor never existed; all four sphere routes 500'd
 *   3. annale prompt templating — see services/ai/prompts.ts
 *   4. `extracted_text` unpersisted on annales — Q&A was unreachable
 *
 * @status ACTIVE   generate/from-resource/ generate/from-upload/ generate/annale/
 * @status ACTIVE   guest/generate/ sessions/ sessions/<id>/ sessions/<id>/add-tool/
 * @status ACTIVE   sessions/<id>/suggestions/ sessions/<id>/ask/ sessions/<id>/share/
 * @status ACTIVE   annales/ annales/<id>/ annales/<id>/ask/ annales/<id>/share/
 * @status ACTIVE   sphere/<id>/ sphere/<id>/annales/
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { AnnaleMode as PrismaAnnaleMode, StudyToolType, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { created, list, noContent, ok } from "../lib/envelope.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { rateLimit, RATE_LIMITS } from "../middleware/rateLimit.js";
import { singleUpload } from "../middleware/upload.js";
import { keyFromUrl, storage } from "../services/storage.js";
import { extractText, SUPPORTED_EXTENSIONS } from "../services/extraction.js";
import { checkGenerationQuota, incrementGenerationQuota, WEEKLY_LIMIT } from "../middleware/generationQuota.js";
import { getWeekStartDate } from "../lib/weekHelper.js";
import { synthesizeSpeech, sanitizeDialogueTurns, type DialogueTurn } from "../services/ttsProvider.js";
import {
  generateAnnale,
  generateFromSelection,
  generateQaAnswer,
  generateSuggestions,
  generateTool,
  isToolType,
  MIN_SOURCE_CHARS,
  VALID_TOOL_TYPES,
  type ToolType,
} from "../services/ai/index.js";
import {
  annaleSessionInclude,
  serializeAnnaleSession,
  serializeAnnaleSessionListItem,
  serializeStudySession,
  serializeStudySessionListItem,
  studySessionInclude,
  type SerializableAnnaleSession,
  type SerializableStudySession,
} from "../serializers/sphera.js";

export const spheraRouter: Router = Router();

// ── Shared helpers ──────────────────────────────────────────────────────────

function idParam(req: Request, name = "id"): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id < 1) throw notFound("Session introuvable.");
  return id;
}

/** Enum value <-> wire value. The DB stores FICHE; the API speaks "fiche". */
const toPrismaTool = (t: ToolType): StudyToolType => t.toUpperCase() as StudyToolType;

/**
 * Accept `tool_types` as a JSON array, a repeated field, or a comma-separated
 * string — all three shapes the two frontends send, depending on whether the call
 * is JSON or multipart.
 */
function parseToolTypes(raw: unknown, allowEmpty = false): ToolType[] {
  let candidates: unknown[] = [];

  if (Array.isArray(raw)) candidates = raw;
  else if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      candidates = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      candidates = raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else if (raw !== undefined && raw !== null) candidates = [raw];

  const tools: ToolType[] = [];
  for (const candidate of candidates) {
    const value = String(candidate).trim().toLowerCase();
    if (!isToolType(value)) {
      throw badRequest(`Type d'outil invalide : '${value}'. Choisis parmi : ${VALID_TOOL_TYPES.join(", ")}.`);
    }
    // De-duplicate: asking for ["quiz","quiz"] should bill one generation, not two.
    if (!tools.includes(value)) tools.push(value);
  }

  if (!allowEmpty && tools.length === 0) throw badRequest("tool_types doit être une liste non vide.");
  return tools;
}

const hasSupportedExtension = (filename: string): boolean =>
  SUPPORTED_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext));

function assertSupportedUpload(filename: string): void {
  if (!hasSupportedExtension(filename)) {
    throw badRequest("Seuls les fichiers PDF, DOCX, TXT et images (PNG, JPG, WEBP) sont acceptés.");
  }
}

/** Fetch a stored file's bytes. Rows carry a key; older rows only a URL. */
async function readStoredFile(row: { fileUrl: string; storageKey: string | null }): Promise<Buffer> {
  const key = row.storageKey ?? keyFromUrl(row.fileUrl);
  if (!key) throw badRequest("Ce fichier n'est plus disponible.");
  try {
    return await storage.get(key);
  } catch (error) {
    console.error("[sphera] failed to read stored file", error);
    throw badRequest("Ce fichier n'est plus disponible.");
  }
}

function assertUsableText(text: string): void {
  if (!text || text.length < MIN_SOURCE_CHARS) {
    throw badRequest("Ce document ne contient pas de texte extractible.");
  }
}

/**
 * Active membership of a sphere, or creator.
 *
 * **[CHANGE]** Django asked `sphere.memberships`, which is not the reverse accessor
 * for the SphereMember FK (`sphere.members` is), so all four sphere-scoped Sphera
 * routes raised AttributeError and returned 500 — sphere sharing has never worked.
 */
async function assertSphereAccess(sphereId: number, userId: number): Promise<void> {
  const sphere = await prisma.sphere.findUnique({
    where: { id: sphereId },
    select: { createdById: true },
  });
  if (!sphere) throw notFound("Sphère introuvable.");
  if (sphere.createdById === userId) return;

  const membership = await prisma.sphereMember.findUnique({
    where: { sphereId_userId: { sphereId, userId } },
    select: { status: true },
  });
  if (membership?.status !== "ACTIVE") throw forbidden("Tu dois être membre de cette sphère.");
}

/** The caller's own session, or 404. */
async function ownStudySession(id: number, userId: number): Promise<SerializableStudySession> {
  const session = await prisma.studySession.findFirst({
    where: { id, ownerId: userId },
    include: studySessionInclude,
  });
  if (!session) throw notFound("Session introuvable.");
  return session as SerializableStudySession;
}

/**
 * A session the caller may read: their own, or one that has been shared.
 *
 * A sphere-shared session additionally requires membership of that sphere —
 * Django checked only `is_shared`, so sharing into a private sphere exposed the
 * session to anyone who could guess its id.
 */
async function readableStudySession(id: number, userId: number): Promise<SerializableStudySession> {
  const session = await prisma.studySession.findUnique({ where: { id }, include: studySessionInclude });
  if (!session) throw notFound("Session introuvable.");
  if (session.ownerId === userId) return session as SerializableStudySession;
  if (!session.isShared) throw notFound("Session introuvable.");
  if (session.sharedSphereId !== null) await assertSphereAccess(session.sharedSphereId, userId);
  return session as SerializableStudySession;
}

async function ownAnnaleSession(id: number, userId: number): Promise<SerializableAnnaleSession> {
  const session = await prisma.annaleSession.findFirst({
    where: { id, ownerId: userId },
    include: annaleSessionInclude,
  });
  if (!session) throw notFound("Annale introuvable.");
  return session as SerializableAnnaleSession;
}

async function readableAnnaleSession(id: number, userId: number): Promise<SerializableAnnaleSession> {
  const session = await prisma.annaleSession.findUnique({ where: { id }, include: annaleSessionInclude });
  if (!session) throw notFound("Annale introuvable.");
  if (session.ownerId === userId) return session as SerializableAnnaleSession;
  if (!session.isShared) throw notFound("Annale introuvable.");
  if (session.sharedSphereId !== null) await assertSphereAccess(session.sharedSphereId, userId);
  return session as SerializableAnnaleSession;
}

/** Generate tool content and synthesize audio if requested. */
async function processToolContent(text: string, tool: ToolType, userId?: number): Promise<Record<string, unknown>> {
  const result = await generateTool(text, tool, userId);
  if (tool === "audio") {
    const audioData = result as { titre?: string; dialogue?: DialogueTurn[] };
    if (Array.isArray(audioData.dialogue) && audioData.dialogue.length > 0) {
      const cleanDialogue = sanitizeDialogueTurns(audioData.dialogue);
      try {
        const { buffer: audioBuffer, provider, lang } = await synthesizeSpeech(cleanDialogue);
        if (audioBuffer) {
          const stored = await storage.put({
            buffer: audioBuffer,
            originalName: `podcast_${Date.now()}.mp3`,
            contentType: "audio/mpeg",
            prefix: "audio-dialogues",
          });
          return {
            ...audioData,
            dialogue: cleanDialogue,
            audioUrl: stored.url,
            audioKey: stored.key,
            ttsProvider: provider,
            lang,
          };
        }
      } catch (err) {
        console.warn("[sphera] dialogue synthesis failed, returning dialogue script only:", err);
      }
      return {
        ...audioData,
        dialogue: cleanDialogue,
      };
    }
  }
  return result;
}

/** Run the requested tools over one source text. */
async function generateAll(text: string, tools: ToolType[], userId?: number): Promise<Record<string, unknown>> {
  const content: Record<string, unknown> = {};
  for (const tool of tools) content[tool] = await processToolContent(text, tool, userId);
  return content;
}

// ── Guest generation (anonymous) ────────────────────────────────────────────
// Blocked to protect AWS credits and encourage account creation per migration spec.

const guestRateLimit = rateLimit({ scope: "sphera-guest", ...RATE_LIMITS.guestGenerate });

spheraRouter.post("/guest/generate/", guestRateLimit, singleUpload("file", "resource"), (_req, res) => {
  res.status(403).json({
    success: false,
    error: "account_required",
    message: "La génération Sphera nécessite un compte étudiant. Connecte-toi ou crée un compte gratuit pour profiter de tes 5 générations par semaine !",
  });
});

// Everything below requires a token.
spheraRouter.use(requireAuth);

/**
 * GET /quota/ (accessible at /api/sphera/quota and /api/study/quota)
 * Returns the student's remaining weekly generation quota.
 */
const quotaHandler = async (req: Request, res: Response) => {
  const me = currentUser(req);
  const weekStart = getWeekStartDate();
  const resetsOn = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    const usage = await prisma.generationUsage.findUnique({
      where: {
        userId_weekStartDate: {
          userId: me.id,
          weekStartDate: weekStart,
        },
      },
    });
    const used = usage?.count ?? 0;

    ok(res, {
      used,
      remaining: Math.max(0, WEEKLY_LIMIT - used),
      limit: WEEKLY_LIMIT,
      resetsOn: resetsOn.toISOString(),
    });
  } catch (error) {
    console.warn("[sphera-quota] Warning: GenerationUsage lookup failed, returning default quota:", error);
    ok(res, {
      used: 0,
      remaining: WEEKLY_LIMIT,
      limit: WEEKLY_LIMIT,
      resetsOn: resetsOn.toISOString(),
    });
  }
};

spheraRouter.get("/quota", quotaHandler);
spheraRouter.get("/quota/", quotaHandler);


// ── Generation ──────────────────────────────────────────────────────────────

const fromResourceSchema = z.object({
  resource_id: z.coerce.number().int().positive().optional(),
  sphere_file_id: z.coerce.number().int().positive().optional(),
  tool_types: z.unknown(),
});

/**
 * POST /generate/from-resource/
 *
 * **[CHANGE] `resource_id` XOR `sphere_file_id`.** Django accepted only
 * `resource_id`, but `SphereSpheraTab` passes a **SphereFile** id — two tables with
 * independent sequences. The call therefore 404'd, or, when the numbers happened to
 * collide, silently generated study material from an unrelated document belonging
 * to someone else. Supplying both, or neither, is now a 400.
 */
spheraRouter.post("/generate/from-resource/", checkGenerationQuota, async (req, res) => {
  const me = currentUser(req);
  const input = fromResourceSchema.parse(req.body ?? {});
  const tools = parseToolTypes(input.tool_types);

  const hasResource = input.resource_id !== undefined;
  const hasSphereFile = input.sphere_file_id !== undefined;
  if (hasResource === hasSphereFile) {
    throw badRequest(
      "Fournis exactement une source : resource_id ou sphere_file_id.",
      { source: ["resource_id et sphere_file_id s'excluent mutuellement, et l'un des deux est requis."] },
    );
  }

  const prismaTools = tools.map(toPrismaTool);

  let source: { fileUrl: string; storageKey: string | null };
  let sourceFilename: string;
  let where: Prisma.StudySessionWhereInput;
  let link: { resourceId?: number; sphereFileId?: number };

  if (hasResource) {
    const resource = await prisma.resource.findUnique({
      where: { id: input.resource_id },
      select: { id: true, title: true, fileUrl: true, storageKey: true },
    });
    if (!resource) throw notFound("Ressource introuvable.");
    if (!resource.fileUrl) throw badRequest("Cette ressource n'a pas de fichier associé.");
    source = resource;
    sourceFilename = resource.title;
    link = { resourceId: resource.id };
    where = { ownerId: me.id, resourceId: resource.id };
  } else {
    const sphereFile = await prisma.sphereFile.findUnique({
      where: { id: input.sphere_file_id },
      select: { id: true, title: true, fileUrl: true, storageKey: true, sphereId: true },
    });
    if (!sphereFile) throw notFound("Fichier de sphère introuvable.");
    // Sphere files are membership-gated: reading one to generate from it is still
    // reading it.
    await assertSphereAccess(sphereFile.sphereId, me.id);
    source = sphereFile;
    sourceFilename = sphereFile.title;
    link = { sphereFileId: sphereFile.id };
    where = { ownerId: me.id, sphereFileId: sphereFile.id };
  }

  // Cache: an identical request returns the stored session rather than paying for
  // generation again. `hasEvery` + length pins it to the same *set* of tools.
  const existing = await prisma.studySession.findFirst({
    where: { ...where, toolTypes: { hasEvery: prismaTools } },
    include: studySessionInclude,
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.toolTypes.length === prismaTools.length) {
    res.status(200).json({
      success: true,
      data: serializeStudySession(existing as SerializableStudySession),
      cached: true,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (typeof res.locals.remainingQuota === "number" && tools.length > res.locals.remainingQuota) {
    res.status(429).json({
      success: false,
      error: "insufficient_quota",
      message: `Il ne te reste que ${res.locals.remainingQuota} génération(s) cette semaine, mais tu as sélectionné ${tools.length} outil(s).`,
    });
    return;
  }

  const text = await extractText(await readStoredFile(source), sourceFilename);
  assertUsableText(text);

  const session = await prisma.studySession.create({
    data: {
      ownerId: me.id,
      ...link,
      sourceFilename,
      toolTypes: prismaTools,
      content: (await generateAll(text, tools, me.id)) as Prisma.InputJsonObject,
      // Persisted for Q&A and for add-tool, which regenerate from it rather than
      // re-reading and re-OCRing the source.
      extractedText: text,
    },
    include: studySessionInclude,
  });

  await incrementGenerationQuota(me.id, tools.length);

  res.status(201).json({
    success: true,
    data: serializeStudySession(session as SerializableStudySession),
    cached: false,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /generate/from-upload/ — multipart.
 *
 * Creates a backing Resource so the file survives the request and the student can
 * re-open the original from the session. Visibility is `friends`, matching Django:
 * an implicitly-created resource must not become public without being asked.
 */
spheraRouter.post("/generate/from-upload/", singleUpload("file", "resource"), async (req, res) => {
  const me = currentUser(req);
  const file = req.file;
  if (!file) throw badRequest("Un fichier est requis.");

  const tools = parseToolTypes((req.body as { tool_types?: unknown }).tool_types, true);

  if (tools.length > 0) {
    const weekStart = getWeekStartDate();
    let usage = await prisma.generationUsage.findUnique({
      where: {
        userId_weekStartDate: {
          userId: me.id,
          weekStartDate: weekStart,
        },
      },
    });
    const currentCount = usage?.count ?? 0;
    const remainingQuota = Math.max(0, WEEKLY_LIMIT - currentCount);
    if (currentCount >= WEEKLY_LIMIT) {
      const nextMonday = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      res.status(429).json({
        success: false,
        error: "weekly_limit_reached",
        message: `Tu as utilisé tes ${WEEKLY_LIMIT} générations Sphera cette semaine. Ça revient lundi prochain !`,
        resetsOn: nextMonday.toISOString(),
      });
      return;
    }
    if (tools.length > remainingQuota) {
      res.status(429).json({
        success: false,
        error: "insufficient_quota",
        message: `Il ne te reste que ${remainingQuota} génération(s) cette semaine, mais tu as sélectionné ${tools.length} outil(s).`,
      });
      return;
    }
  }

  assertSupportedUpload(file.originalname);

  // Extract before persisting anything: a document with no text should not leave a
  // stray resource behind.
  const text = await extractText(file.buffer, file.originalname);
  assertUsableText(text);

  const stored = await storage.put({
    buffer: file.buffer,
    originalName: file.originalname,
    contentType: file.mimetype,
    prefix: "resources",
  });

  const resource = await prisma.resource.create({
    data: {
      title: file.originalname,
      authorId: me.id,
      fileUrl: stored.url,
      storageKey: stored.key,
      fileSize: file.size,
      fileType: file.mimetype || "application/octet-stream",
      type: "COURS",
      visibility: "FRIENDS",
    },
    select: { id: true },
  });

  const session = await prisma.studySession.create({
    data: {
      ownerId: me.id,
      resourceId: resource.id,
      sourceFilename: file.originalname,
      toolTypes: tools.map(toPrismaTool),
      content: (tools.length > 0 ? await generateAll(text, tools, me.id) : {}) as Prisma.InputJsonObject,
      extractedText: text,
    },
    include: studySessionInclude,
  });

  if (tools.length > 0) {
    await incrementGenerationQuota(me.id, tools.length);
  }

  created(res, serializeStudySession(session as SerializableStudySession));
});

const annaleSchema = z.object({
  mode: z.enum(["complete", "rapide"]).optional(),
  resource_id: z.coerce.number().int().positive().optional(),
  cours_resource_id: z.coerce.number().int().positive().optional(),
});

/**
 * POST /generate/annale/ — accepts multipart or JSON.
 *
 * **[CHANGE] `extracted_text` is persisted.** Django's create() omitted it, so
 * `POST /annales/<id>/ask/` — which reads it — could only ever return 400. Annale
 * Q&A has never worked for anyone.
 */
spheraRouter.post("/generate/annale/", checkGenerationQuota, singleUpload("file", "resource"), async (req, res) => {
  const me = currentUser(req);
  const input = annaleSchema.parse(req.body ?? {});
  const mode = input.mode ?? "complete";
  const file = req.file;

  let annaleBuffer: Buffer;
  let sourceFilename: string;
  let annaleResourceId: number | null = null;

  if (input.resource_id !== undefined) {
    const resource = await prisma.resource.findUnique({
      where: { id: input.resource_id },
      select: { id: true, title: true, fileUrl: true, storageKey: true },
    });
    if (!resource) throw notFound("Ressource d'annale introuvable.");
    if (!resource.fileUrl) throw badRequest("Cette ressource n'a pas de fichier.");
    annaleBuffer = await readStoredFile(resource);
    sourceFilename = resource.title;
    annaleResourceId = resource.id;
  } else if (file) {
    assertSupportedUpload(file.originalname);
    annaleBuffer = file.buffer;
    sourceFilename = file.originalname;

    try {
      const stored = await storage.put({
        buffer: file.buffer,
        originalName: file.originalname,
        contentType: file.mimetype,
        prefix: "resources",
      });

      const resource = await prisma.resource.create({
        data: {
          title: file.originalname,
          authorId: me.id,
          fileUrl: stored.url,
          storageKey: stored.key,
          fileSize: file.size,
          fileType: file.mimetype || "application/octet-stream",
          type: "EXAM_PAPERS",
          visibility: "FRIENDS",
        },
        select: { id: true },
      });
      annaleResourceId = resource.id;
    } catch (storageErr) {
      console.warn("[sphera] Could not persist annale file to storage:", storageErr);
    }
  } else {
    throw badRequest("Un fichier ou resource_id est requis.");
  }

  const annaleText = await extractText(annaleBuffer, sourceFilename);
  if (!annaleText || annaleText.length < MIN_SOURCE_CHARS) {
    throw badRequest("L'annale ne contient pas de texte extractible.");
  }

  // The reference course is best-effort: a course that cannot be read falls back to
  // correcting the paper alone rather than failing the whole request.
  let coursText = "";
  let coursResourceId: number | null = null;
  if (input.cours_resource_id !== undefined) {
    const cours = await prisma.resource.findUnique({
      where: { id: input.cours_resource_id },
      select: { id: true, title: true, fileUrl: true, storageKey: true },
    });
    if (!cours) throw notFound("Ressource cours introuvable.");
    coursResourceId = cours.id;
    if (cours.fileUrl) {
      try {
        coursText = await extractText(await readStoredFile(cours), cours.title);
      } catch (error) {
        console.warn("[sphera] could not extract reference course:", error);
      }
    }
  }

  const session = await prisma.annaleSession.create({
    data: {
      ownerId: me.id,
      mode: mode.toUpperCase() as PrismaAnnaleMode,
      sourceFilename,
      resourceId: annaleResourceId,
      coursResourceId,
      content: (await generateAnnale(annaleText, mode, coursText || null, me.id)) as Prisma.InputJsonObject,
      extractedText: annaleText,
    },
    include: annaleSessionInclude,
  });

  await incrementGenerationQuota(me.id, 1);

  created(res, serializeAnnaleSession(session as SerializableAnnaleSession));
});

// ── V3: Dedicated Mind Map & Audio Summary endpoints ─────────────────────────

async function handleSingleToolGeneration(
  req: Request,
  res: Response,
  tool: "mindmap" | "audio",
): Promise<void> {
  const me = currentUser(req);
  const file = req.file;
  const rawResourceId = req.body?.resource_id ?? req.body?.resourceId;
  const rawSphereFileId = req.body?.sphere_file_id ?? req.body?.sphereFileId;
  const resourceId = rawResourceId ? Number(rawResourceId) : undefined;
  const sphereFileId = rawSphereFileId ? Number(rawSphereFileId) : undefined;

  let text: string;
  let sourceFilename: string;
  let link: { resourceId?: number; sphereFileId?: number } = {};

  if (file) {
    assertSupportedUpload(file.originalname);
    text = await extractText(file.buffer, file.originalname);
    assertUsableText(text);

    const stored = await storage.put({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      prefix: "resources",
    });

    const resource = await prisma.resource.create({
      data: {
        title: file.originalname,
        authorId: me.id,
        fileUrl: stored.url,
        storageKey: stored.key,
        fileSize: file.size,
        fileType: file.mimetype || "application/octet-stream",
        type: "COURS",
        visibility: "FRIENDS",
      },
      select: { id: true },
    });

    link = { resourceId: resource.id };
    sourceFilename = file.originalname;
  } else if (resourceId) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, title: true, fileUrl: true, storageKey: true },
    });
    if (!resource) throw notFound("Ressource introuvable.");
    if (!resource.fileUrl) throw badRequest("Cette ressource n'a pas de fichier associé.");
    text = await extractText(await readStoredFile(resource), resource.title);
    assertUsableText(text);
    link = { resourceId: resource.id };
    sourceFilename = resource.title;
  } else if (sphereFileId) {
    const sphereFile = await prisma.sphereFile.findUnique({
      where: { id: sphereFileId },
      select: { id: true, title: true, fileUrl: true, storageKey: true, sphereId: true },
    });
    if (!sphereFile) throw notFound("Fichier de sphère introuvable.");
    await assertSphereAccess(sphereFile.sphereId, me.id);
    text = await extractText(await readStoredFile(sphereFile), sphereFile.title);
    assertUsableText(text);
    link = { sphereFileId: sphereFile.id };
    sourceFilename = sphereFile.title;
  } else {
    throw badRequest("Fournis un fichier ou un resource_id.");
  }

  const result = await processToolContent(text, tool, me.id);
  const prismaTool = toPrismaTool(tool);

  const session = await prisma.studySession.create({
    data: {
      ownerId: me.id,
      ...link,
      sourceFilename,
      toolTypes: [prismaTool],
      content: { [tool]: result } as Prisma.InputJsonObject,
      extractedText: text,
    },
    include: studySessionInclude,
  });

  await incrementGenerationQuota(me.id, 1);
  created(res, serializeStudySession(session as SerializableStudySession));
}

spheraRouter.post("/generate/mindmap/", checkGenerationQuota, singleUpload("file", "resource"), (req, res) =>
  handleSingleToolGeneration(req, res, "mindmap"),
);
spheraRouter.post("/generate/mindmap", checkGenerationQuota, singleUpload("file", "resource"), (req, res) =>
  handleSingleToolGeneration(req, res, "mindmap"),
);
spheraRouter.post("/generate/audio/", checkGenerationQuota, singleUpload("file", "resource"), (req, res) =>
  handleSingleToolGeneration(req, res, "audio"),
);
spheraRouter.post("/generate/audio", checkGenerationQuota, singleUpload("file", "resource"), (req, res) =>
  handleSingleToolGeneration(req, res, "audio"),
);

// ── Study sessions ──────────────────────────────────────────────────────────

spheraRouter.get("/sessions/", async (req, res) => {
  const me = currentUser(req);
  const where: Prisma.StudySessionWhereInput = { ownerId: me.id };

  const toolType = String(req.query.tool_type ?? "").trim().toLowerCase();
  if (toolType && isToolType(toolType)) where.toolTypes = { has: toPrismaTool(toolType) };

  const sessions = await prisma.studySession.findMany({
    where,
    include: studySessionInclude,
    orderBy: { createdAt: "desc" },
  });

  list(res, sessions.map((s) => serializeStudySessionListItem(s as SerializableStudySession)));
});

spheraRouter.get("/sessions/:id/", async (req, res) => {
  const me = currentUser(req);
  try {
    ok(res, serializeStudySession(await readableStudySession(idParam(req), me.id)));
  } catch (err) {
    try {
      ok(res, serializeAnnaleSession(await readableAnnaleSession(idParam(req), me.id)));
    } catch {
      throw err;
    }
  }
});

spheraRouter.delete("/sessions/:id/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);
  await prisma.studySession.delete({ where: { id: session.id } });
  noContent(res);
});

/**
 * PATCH /sessions/<id>/add-tool/
 *
 * Regenerates from the stored `extracted_text`, so adding a quiz to an existing
 * fiche costs one model call and no re-OCR.
 */
spheraRouter.patch("/sessions/:id/add-tool/", checkGenerationQuota, async (req, res) => {
  const me = currentUser(req);
  const raw = String((req.body as { tool_type?: unknown })?.tool_type ?? "").trim().toLowerCase();
  if (!isToolType(raw)) {
    throw badRequest(`Type d'outil invalide. Choisis parmi : ${VALID_TOOL_TYPES.join(", ")}.`);
  }

  const session = await ownStudySession(idParam(req), me.id);
  const content = (session.content ?? {}) as Record<string, unknown>;

  if (session.toolTypes.includes(toPrismaTool(raw)) && raw in content) {
    throw badRequest(`L'outil '${raw}' a déjà été généré pour cette session.`);
  }

  if (!session.extractedText) {
    throw badRequest("Aucun texte extractible disponible dans cette session pour générer de nouveaux outils.");
  }

  const updated = await prisma.studySession.update({
    where: { id: session.id },
    data: {
      content: { ...content, [raw]: await processToolContent(session.extractedText, raw, me.id) } as Prisma.InputJsonObject,
      toolTypes: session.toolTypes.includes(toPrismaTool(raw))
        ? session.toolTypes
        : [...session.toolTypes, toPrismaTool(raw)],
    },
    include: studySessionInclude,
  });

  await incrementGenerationQuota(me.id, 1);

  ok(res, serializeStudySession(updated as SerializableStudySession));
});

const createFromSelectionSchema = z.object({
  tool_type: z.enum(["quiz", "flashcards"]),
  selected_text: z.string().trim().min(3, "Le passage sélectionné doit contenir au moins 3 caractères."),
});

/**
 * POST /sessions/<id>/create-from-selection/
 *
 * Generates an interactive quiz question or flashcard from highlighted text
 * and appends it directly to session.content[tool_type].
 */
spheraRouter.post("/sessions/:id/create-from-selection/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);
  const { tool_type, selected_text } = createFromSelectionSchema.parse(req.body ?? {});

  const generated = await generateFromSelection(selected_text, tool_type, me.id);
  const currentContent = (session.content ?? {}) as Record<string, any>;

  const defaultTitle = session.resource?.title ?? session.sourceFilename ?? (tool_type === "quiz" ? "Quiz" : "Flashcards");
  let updatedToolContent: any;
  let createdItem: any;
  let newItems: any[] = [];

  if (tool_type === "quiz") {
    const existingQuestions = Array.isArray(currentContent.quiz?.questions)
      ? currentContent.quiz.questions
      : [];
    newItems = Array.isArray(generated.questions) ? generated.questions : [];
    createdItem = newItems[0] || null;
    updatedToolContent = {
      ...(currentContent.quiz ?? {}),
      titre: currentContent.quiz?.titre || defaultTitle,
      questions: [...existingQuestions, ...newItems],
    };
  } else {
    const existingCartes = Array.isArray(currentContent.flashcards?.cartes)
      ? currentContent.flashcards.cartes
      : [];
    newItems = Array.isArray(generated.cartes) ? generated.cartes : [];
    createdItem = newItems[0] || null;
    updatedToolContent = {
      ...(currentContent.flashcards ?? {}),
      titre: currentContent.flashcards?.titre || defaultTitle,
      cartes: [...existingCartes, ...newItems],
    };
  }

  const prismaTool = toPrismaTool(tool_type);
  const updatedToolTypes = session.toolTypes.includes(prismaTool)
    ? session.toolTypes
    : [...session.toolTypes, prismaTool];

  const updatedSession = await prisma.studySession.update({
    where: { id: session.id },
    data: {
      content: {
        ...currentContent,
        [tool_type]: updatedToolContent,
      } as Prisma.InputJsonObject,
      toolTypes: updatedToolTypes,
    },
    include: studySessionInclude,
  });

  const count = newItems.length;

  ok(res, {
    created_items: newItems,
    created_item: createdItem,
    count,
    tool_type,
    session: serializeStudySession(updatedSession as SerializableStudySession),
  });
});

/**
 * GET /sessions/<id>/suggestions/ — generated once, then served from the row.
 *
 * A session whose source text is gone returns [] rather than erroring; the client
 * simply shows no prompts.
 */
spheraRouter.get("/sessions/:id/suggestions/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);

  const stored = Array.isArray(session.suggestions) ? (session.suggestions as string[]) : [];
  if (stored.length > 0) {
    ok(res, { suggestions: stored });
    return;
  }
  if (!session.extractedText) {
    ok(res, { suggestions: [] });
    return;
  }

  const suggestions = await generateSuggestions(session.extractedText, me.id);
  if (suggestions.length > 0) {
    await prisma.studySession.update({
      where: { id: session.id },
      data: { suggestions: suggestions as Prisma.InputJsonValue },
    });
  }
  ok(res, { suggestions });
});

const askSchema = z.object({ question: z.string().trim().min(1, "La question ne peut pas être vide.") });

interface QaEntry {
  question: string;
  answer: string;
  created_at: string;
}

function appendQa(history: unknown, entry: QaEntry): QaEntry[] {
  return [...(Array.isArray(history) ? (history as QaEntry[]) : []), entry];
}

spheraRouter.post("/sessions/:id/ask/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);
  const { question } = askSchema.parse(req.body ?? {});

  if (!session.extractedText) {
    throw badRequest(
      "Le texte de ce cours n'est pas disponible pour le Q&A. Régénère la session depuis la ressource originale.",
    );
  }

  const entry: QaEntry = {
    question,
    answer: await generateQaAnswer(session.extractedText, question, me.id),
    created_at: new Date().toISOString(),
  };

  await prisma.studySession.update({
    where: { id: session.id },
    data: { qaHistory: appendQa(session.qaHistory, entry) as unknown as Prisma.InputJsonValue },
  });

  ok(res, entry);
});

const updateTextSchema = z.object({
  text: z.string().trim().min(10, "Le texte doit contenir au moins 10 caractères."),
});

spheraRouter.patch("/sessions/:id/text/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);
  const { text } = updateTextSchema.parse(req.body ?? {});

  const updated = await prisma.studySession.update({
    where: { id: session.id },
    data: { extractedText: text },
  });

  ok(res, { extracted_text: updated.extractedText }, "Texte du cours mis à jour.");
});

const shareSchema = z.object({ sphere_id: z.coerce.number().int().positive().optional() });

spheraRouter.post("/sessions/:id/share/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);
  const { sphere_id: sphereId } = shareSchema.parse(req.body ?? {});

  if (sphereId === undefined) {
    // Link sharing: readable by anyone holding the id, not attached to a sphere.
    const updated = await prisma.studySession.update({
      where: { id: session.id },
      data: { isShared: true, sharedSphereId: null },
      include: studySessionInclude,
    });
    ok(res, serializeStudySession(updated as SerializableStudySession), "Partage par lien activé.");
    return;
  }

  await assertSphereAccess(sphereId, me.id);
  const updated = await prisma.studySession.update({
    where: { id: session.id },
    data: { isShared: true, sharedSphereId: sphereId },
    include: studySessionInclude,
  });
  ok(res, serializeStudySession(updated as SerializableStudySession));
});

spheraRouter.delete("/sessions/:id/share/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownStudySession(idParam(req), me.id);
  await prisma.studySession.update({
    where: { id: session.id },
    data: { isShared: false, sharedSphereId: null },
  });
  ok(res, null, "Partage annulé.");
});

// ── Annales ─────────────────────────────────────────────────────────────────

spheraRouter.get("/annales/", async (req, res) => {
  const me = currentUser(req);
  const sessions = await prisma.annaleSession.findMany({
    where: { ownerId: me.id },
    include: annaleSessionInclude,
    orderBy: { createdAt: "desc" },
  });
  list(res, sessions.map((s) => serializeAnnaleSessionListItem(s as SerializableAnnaleSession)));
});

spheraRouter.get("/annales/:id/", async (req, res) => {
  const me = currentUser(req);
  try {
    ok(res, serializeAnnaleSession(await readableAnnaleSession(idParam(req), me.id)));
  } catch (err) {
    try {
      ok(res, serializeStudySession(await readableStudySession(idParam(req), me.id)));
    } catch {
      throw err;
    }
  }
});

spheraRouter.delete("/annales/:id/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownAnnaleSession(idParam(req), me.id);
  await prisma.annaleSession.delete({ where: { id: session.id } });
  noContent(res);
});

/** Readable by anyone who may read the annale, so a shared correction is askable. */
spheraRouter.post("/annales/:id/ask/", async (req, res) => {
  const me = currentUser(req);
  const session = await readableAnnaleSession(idParam(req), me.id);
  const { question } = askSchema.parse(req.body ?? {});

  if (!session.extractedText) {
    throw badRequest("Le texte de ce document n'est pas disponible pour le Q&A.");
  }

  const entry: QaEntry = {
    question,
    answer: await generateQaAnswer(session.extractedText, question, me.id),
    created_at: new Date().toISOString(),
  };

  await prisma.annaleSession.update({
    where: { id: session.id },
    data: { qaHistory: appendQa(session.qaHistory, entry) as unknown as Prisma.InputJsonValue },
  });

  ok(res, entry);
});

spheraRouter.post("/annales/:id/share/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownAnnaleSession(idParam(req), me.id);
  const { sphere_id: sphereId } = shareSchema.parse(req.body ?? {});

  if (sphereId !== undefined) await assertSphereAccess(sphereId, me.id);

  const updated = await prisma.annaleSession.update({
    where: { id: session.id },
    data: { isShared: true, sharedSphereId: sphereId ?? null },
    include: annaleSessionInclude,
  });
  ok(
    res,
    serializeAnnaleSession(updated as SerializableAnnaleSession),
    sphereId === undefined ? "Partage par lien activé." : undefined,
  );
});

spheraRouter.delete("/annales/:id/share/", async (req, res) => {
  const me = currentUser(req);
  const session = await ownAnnaleSession(idParam(req), me.id);
  await prisma.annaleSession.update({
    where: { id: session.id },
    data: { isShared: false, sharedSphereId: null },
  });
  ok(res, null, "Partage annulé.");
});

// ── Sphere-shared listings ──────────────────────────────────────────────────
// Both routes 500'd in Django via the `sphere.memberships` typo; see
// assertSphereAccess above.

spheraRouter.get("/sphere/:id/annales/", async (req, res) => {
  const me = currentUser(req);
  const sphereId = idParam(req);
  await assertSphereAccess(sphereId, me.id);

  const sessions = await prisma.annaleSession.findMany({
    where: { sharedSphereId: sphereId, isShared: true },
    include: annaleSessionInclude,
    orderBy: { createdAt: "desc" },
  });
  list(res, sessions.map((s) => serializeAnnaleSessionListItem(s as SerializableAnnaleSession)));
});

spheraRouter.get("/sphere/:id/", async (req, res) => {
  const me = currentUser(req);
  const sphereId = idParam(req);
  await assertSphereAccess(sphereId, me.id);

  const sessions = await prisma.studySession.findMany({
    where: { sharedSphereId: sphereId, isShared: true },
    include: studySessionInclude,
    orderBy: { createdAt: "desc" },
  });
  list(res, sessions.map((s) => serializeStudySessionListItem(s as SerializableStudySession)));
});
