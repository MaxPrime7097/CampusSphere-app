import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { created, ok, list } from "../lib/envelope.js";
import { badRequest, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { singleUpload } from "../middleware/upload.js";
import { checkGenerationQuota, incrementGenerationQuota } from "../middleware/generationQuota.js";
import { extractText } from "../services/extraction.js";
import { generateTool } from "../services/ai/index.js";
import { storage, keyFromUrl } from "../services/storage.js";

export const quizLiveRouter: Router = Router();

// Define schemas
const QuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.coerce.number().min(0).max(3),
  timeLimit: z.coerce.number().optional().default(30),
  points: z.coerce.number().optional().default(1000),
});

const CreateManualSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

// Helpers
function parseResourceId(input: unknown): number | null {
  if (typeof input === "number" && !isNaN(input)) return input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    const match = trimmed.match(/\/(\d+)(?:\/|\?|$)/) || trimmed.match(/(\d+)/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

async function extractTextFromResource(resourceId: number): Promise<{ text: string; title: string }> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    throw notFound("Ressource introuvable.");
  }

  const key = resource.storageKey ?? keyFromUrl(resource.fileUrl);
  if (!key) {
    throw badRequest("Ce document n'a pas de fichier associé dans le stockage.");
  }

  const buffer = await storage.get(key);
  const ext = resource.title.includes(".") ? "" : `.${resource.fileType.split("/").pop() || "pdf"}`;
  const filename = `${resource.title}${ext}`;
  const text = await extractText(buffer, filename);
  return { text, title: resource.title };
}

async function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueRoomCode() {
  let code = "";
  let exists = true;
  while (exists) {
    code = await generateRoomCode();
    const session = await prisma.quizLiveSession.findUnique({
      where: { roomCode: code },
    });
    if (!session) exists = false;
  }
  return code;
}

async function createSessionWithQuestions(hostId: number, title: string, questions: z.infer<typeof QuestionSchema>[]) {
  const roomCode = await getUniqueRoomCode();
  const session = await prisma.quizLiveSession.create({
    data: {
      roomCode,
      hostId,
      title,
      questions,
    },
  });
  return session;
}

function cleanOptionText(text: string): string {
  if (typeof text !== "string") return "";
  return text.replace(/^[A-Da-d0-9][.)\-:]\s*/, "").trim();
}

function mapAiQuizQuestions(generatedQuestions: any[], defaultTime = 30, defaultPoints = 1000) {
  return generatedQuestions.map((q: any) => {
    let initialCorrectIndex = 0;
    const letter = typeof q.bonne_reponse === "string" ? q.bonne_reponse.trim().toUpperCase()[0] : "";
    if (letter === "A") initialCorrectIndex = 0;
    else if (letter === "B") initialCorrectIndex = 1;
    else if (letter === "C") initialCorrectIndex = 2;
    else if (letter === "D") initialCorrectIndex = 3;
    else if (typeof q.bonne_reponse === "number" && q.bonne_reponse >= 0 && q.bonne_reponse <= 3) {
      initialCorrectIndex = q.bonne_reponse;
    }

    const rawOptions = Array.isArray(q.options) ? q.options : [];
    const fallbackLabels = ["Option A", "Option B", "Option C", "Option D"];

    // Prepare items with their correctness flag and cleaned text
    const optionItems = [0, 1, 2, 3].map(i => {
      const raw = rawOptions[i];
      const cleaned = cleanOptionText(raw || fallbackLabels[i]);
      return {
        text: cleaned || fallbackLabels[i],
        isCorrect: i === initialCorrectIndex,
      };
    });

    // Fisher-Yates shuffle to randomize answer position across A, B, C, D
    for (let i = optionItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionItems[i], optionItems[j]] = [optionItems[j], optionItems[i]];
    }

    const shuffledOptions = optionItems.map(item => item.text);
    const newCorrectIndex = optionItems.findIndex(item => item.isCorrect);

    return {
      question: q.question || "Question",
      options: shuffledOptions,
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      timeLimit: typeof q.timeLimit === "number" && q.timeLimit > 0 ? q.timeLimit : defaultTime,
      points: typeof q.points === "number" && q.points > 0 ? q.points : defaultPoints,
    };
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────

/**
 * 1. Génération de questions par Sphera SANS créer de session immédiatement.
 * Permet au créateur de prévisualiser et modifier les questions dans "Créer manuellement".
 */
quizLiveRouter.post(
  "/generate-questions/",
  requireAuth,
  singleUpload("file", "resource"),
  checkGenerationQuota,
  async (req, res) => {
    const user = currentUser(req);
    let title = (req.body?.title as string)?.trim() || "";
    const defaultTime = Number(req.body?.timeLimit) || 30;
    const defaultPoints = Number(req.body?.points) || 1000;

    let textToExtract = "";

    if (req.file) {
      textToExtract = await extractText(req.file.buffer, req.file.originalname);
      if (!title && req.file.originalname) {
        title = req.file.originalname.replace(/\.[^/.]+$/, "");
      }
    } else {
      const resId = parseResourceId(req.body?.resourceId ?? req.body?.resource_id ?? req.body?.resourceInput);
      if (!resId) {
        throw badRequest("Veuillez sélectionner un fichier ou indiquer un lien/ID de document valide.");
      }
      const resData = await extractTextFromResource(resId);
      textToExtract = resData.text;
      if (!title) title = resData.title;
    }

    if (!textToExtract || textToExtract.trim().length < 50) {
      throw badRequest("Ce document ne contient pas assez de texte extractible pour concevoir un quiz.");
    }

    const generated = await generateTool(textToExtract, "quiz", user.id);
    if (!generated || !Array.isArray(generated.questions) || generated.questions.length === 0) {
      throw badRequest("Échec de la génération des questions par l'assistant Sphera.");
    }

    const mappedQuestions = mapAiQuizQuestions(generated.questions, defaultTime, defaultPoints);
    await incrementGenerationQuota(user.id, 1);

    return ok(res, {
      title: title || "Quiz Live Sphera",
      questions: mappedQuestions,
    });
  },
);

/**
 * 2. Création manuelle d'une session (utilisée après prévisualisation ou saisie directe).
 */
quizLiveRouter.post("/create-manual/", requireAuth, async (req, res) => {
  const data = CreateManualSchema.parse(req.body);
  const user = currentUser(req);
  const session = await createSessionWithQuestions(user.id, data.title, data.questions);
  return created(res, session);
});

/**
 * 3. Génération directe depuis une ressource (rétrocompatibilité).
 */
quizLiveRouter.post("/generate-and-create/", requireAuth, checkGenerationQuota, async (req, res) => {
  const user = currentUser(req);
  const rawId = req.body?.resourceId ?? req.body?.resource_id ?? req.body?.resourceInput;
  const resId = parseResourceId(rawId);
  if (!resId) {
    throw badRequest("Lien ou identifiant de ressource invalide.");
  }

  const { text: textToExtract, title: resTitle } = await extractTextFromResource(resId);
  if (!textToExtract || textToExtract.trim().length < 50) {
    throw badRequest("Ce document ne contient pas de texte extractible.");
  }

  const title = (req.body?.title as string)?.trim() || resTitle || "Quiz Live";
  const defaultTime = Number(req.body?.timeLimit) || 30;
  const defaultPoints = Number(req.body?.points) || 1000;

  const generated = await generateTool(textToExtract, "quiz", user.id);
  if (!generated || !Array.isArray(generated.questions) || generated.questions.length === 0) {
    throw badRequest("Échec de la génération du quiz.");
  }

  const mappedQuestions = mapAiQuizQuestions(generated.questions, defaultTime, defaultPoints);
  const session = await createSessionWithQuestions(user.id, title, mappedQuestions);
  await incrementGenerationQuota(user.id, 1);
  return created(res, session);
});

/**
 * 4. Génération directe depuis un upload (rétrocompatibilité).
 */
quizLiveRouter.post(
  "/generate-from-upload/",
  requireAuth,
  singleUpload("file", "resource"),
  checkGenerationQuota,
  async (req, res) => {
    const user = currentUser(req);
    if (!req.file) {
      throw badRequest("Veuillez sélectionner un fichier.");
    }

    const title = (req.body?.title as string)?.trim() || req.file.originalname.replace(/\.[^/.]+$/, "") || "Quiz Généré";
    const defaultTime = Number(req.body?.timeLimit) || 30;
    const defaultPoints = Number(req.body?.points) || 1000;

    const textToExtract = await extractText(req.file.buffer, req.file.originalname);
    if (!textToExtract || textToExtract.trim().length < 50) {
      throw badRequest("Ce document ne contient pas assez de texte extractible.");
    }

    const generated = await generateTool(textToExtract, "quiz", user.id);
    if (!generated || !Array.isArray(generated.questions) || generated.questions.length === 0) {
      throw badRequest("Échec de la génération du quiz.");
    }

    const mappedQuestions = mapAiQuizQuestions(generated.questions, defaultTime, defaultPoints);
    const session = await createSessionWithQuestions(user.id, title, mappedQuestions);
    await incrementGenerationQuota(user.id, 1);
    return created(res, session);
  },
);

/**
 * 5. Importation JSON
 */
quizLiveRouter.post("/import-json/", requireAuth, singleUpload("file", "other"), async (req, res) => {
  const user = currentUser(req);
  const title = (req.body?.title as string)?.trim() || "Quiz Importé";

  if (!req.file) {
    throw badRequest("Veuillez sélectionner un fichier JSON.");
  }

  try {
    const fileContent = req.file.buffer.toString("utf-8");
    const parsed = JSON.parse(fileContent);

    let questionsToImport: any[] = [];
    if (Array.isArray(parsed)) {
      questionsToImport = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      questionsToImport = parsed.questions;
    } else {
      throw badRequest("Format JSON invalide. Une liste de questions est requise.");
    }

    const data = CreateManualSchema.parse({ title, questions: questionsToImport });
    const session = await createSessionWithQuestions(user.id, data.title, data.questions);
    return created(res, session);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw badRequest(`Format de question invalide dans le JSON: ${err.errors.map(e => e.message).join(", ")}`);
    }
    throw badRequest("Fichier JSON invalide.");
  }
});

quizLiveRouter.get("/my-sessions/", requireAuth, async (req, res) => {
  const user = currentUser(req);
  const sessions = await prisma.quizLiveSession.findMany({
    where: { hostId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return list(res, sessions);
});

quizLiveRouter.delete("/:roomCode/", requireAuth, async (req, res) => {
  const user = currentUser(req);
  const roomCode = req.params.roomCode as string;

  const session = await prisma.quizLiveSession.findUnique({
    where: { roomCode },
  });

  if (!session) throw notFound();
  if (session.hostId !== user.id) throw badRequest("Non autorisé");

  await prisma.quizLiveSession.delete({
    where: { roomCode },
  });

  return ok(res, { success: true });
});

quizLiveRouter.patch("/:roomCode/reset/", requireAuth, async (req, res) => {
  const user = currentUser(req);
  const roomCode = req.params.roomCode as string;

  const session = await prisma.quizLiveSession.findUnique({
    where: { roomCode },
  });

  if (!session) throw notFound();
  if (session.hostId !== user.id) throw badRequest("Non autorisé");

  await prisma.quizLiveParticipant.deleteMany({
    where: { sessionId: session.id },
  });

  await prisma.quizLiveSession.update({
    where: { id: session.id },
    data: {
      status: "WAITING",
      currentQuestionIndex: 0,
    },
  });

  return ok(res, { success: true });
});

quizLiveRouter.get("/:roomCode/host/", requireAuth, async (req, res) => {
  const user = currentUser(req);
  const roomCode = req.params.roomCode as string;

  const session = await prisma.quizLiveSession.findUnique({
    where: { roomCode },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!session) throw notFound("Session introuvable");
  if (session.hostId !== user.id) throw badRequest("Non autorisé");

  return ok(res, {
    id: session.id,
    roomCode: session.roomCode,
    title: session.title,
    status: session.status,
    questions: session.questions,
    participantCount: session._count.participants,
    createdAt: session.createdAt,
  });
});

quizLiveRouter.patch("/:roomCode/questions/", requireAuth, async (req, res) => {
  const user = currentUser(req);
  const roomCode = req.params.roomCode as string;

  const session = await prisma.quizLiveSession.findUnique({
    where: { roomCode },
  });

  if (!session) throw notFound("Session introuvable");
  if (session.hostId !== user.id) throw badRequest("Non autorisé");
  if (session.status !== "WAITING") {
    throw badRequest("Impossible de modifier les questions d'une partie déjà lancée");
  }

  const UpdateSchema = z.object({
    title: z.string().min(1).optional(),
    questions: z.array(QuestionSchema).min(1, "Au moins une question est requise"),
  });

  const parsed = UpdateSchema.parse(req.body);

  const updated = await prisma.quizLiveSession.update({
    where: { roomCode },
    data: {
      ...(parsed.title ? { title: parsed.title } : {}),
      questions: parsed.questions,
    },
  });

  return ok(res, {
    id: updated.id,
    roomCode: updated.roomCode,
    title: updated.title,
    questions: updated.questions,
    status: updated.status,
  });
});

quizLiveRouter.get("/:roomCode/", async (req, res) => {
  const roomCode = (req.params.roomCode as string).toUpperCase().trim();
  const session = await prisma.quizLiveSession.findUnique({
    where: { roomCode },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  if (!session) {
    throw notFound();
  }

  return ok(res, {
    title: session.title,
    status: session.status,
    participantCount: session._count.participants,
  });
});
