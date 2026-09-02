import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { created, ok, list } from "../lib/envelope.js";
import { badRequest, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { singleUpload } from "../middleware/upload.js";
import { extractText } from "../services/extraction.js";
import { generateTool } from "../services/ai/index.js";
import { storage } from "../services/storage.js";

export const quizLiveRouter = Router();

// Define schemas
const QuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().min(0).max(3),
  timeLimit: z.number().optional().default(30),
});

const CreateManualSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

const GenerateSchema = z.object({
  resourceId: z.number(),
  title: z.string().min(1),
});

// Helpers
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

// Routes
quizLiveRouter.post("/create-manual/", requireAuth, async (req, res) => {
  const data = CreateManualSchema.parse(req.body);
  const user = currentUser(req);
  const session = await createSessionWithQuestions(user.id, data.title, data.questions);
  return created(res, session);
});

quizLiveRouter.post("/generate-and-create/", requireAuth, async (req, res) => {
  const data = GenerateSchema.parse(req.body);
  const user = currentUser(req);

  const resource = await prisma.resource.findUnique({
    where: { id: data.resourceId },
  });

  if (!resource) {
    throw notFound();
  }

  let textToExtract = "";
  if (resource.storageKey) {
      const fileData = await storage.get(resource.storageKey);
      if (fileData) {
        textToExtract = await extractText(Buffer.from(fileData.buffer), resource.fileType);
      }
  }

  if (!textToExtract) {
      throw badRequest("Could not extract text from resource");
  }

  const generated = await generateTool(textToExtract, "quiz");
  
  if (!generated || !Array.isArray(generated.questions)) {
      throw badRequest("Failed to generate quiz");
  }

  const mappedQuestions = generated.questions.map((q: any) => {
      let correctIndex = 0;
      if (q.bonne_reponse === "A") correctIndex = 0;
      else if (q.bonne_reponse === "B") correctIndex = 1;
      else if (q.bonne_reponse === "C") correctIndex = 2;
      else if (q.bonne_reponse === "D") correctIndex = 3;

      return {
          question: q.question,
          options: q.options || [],
          correctIndex,
          timeLimit: 30, // Default time limit
      };
  });

  const session = await createSessionWithQuestions(user.id, data.title, mappedQuestions);
  return created(res, session);
});

quizLiveRouter.post("/import-json/", requireAuth, singleUpload("file", "other"), async (req, res) => {
    const user = currentUser(req);
    const title = req.body.title || "Imported Quiz";

    if (!req.file) {
        throw badRequest("Missing file");
    }

    try {
        const fileContent = req.file.buffer.toString("utf-8");
        const parsed = JSON.parse(fileContent);
        
        let questionsToImport = [];
        if (Array.isArray(parsed)) {
            questionsToImport = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
            questionsToImport = parsed.questions;
        } else {
             throw badRequest("Invalid JSON format");
        }

        const data = CreateManualSchema.parse({ title, questions: questionsToImport });
        const session = await createSessionWithQuestions(user.id, data.title, data.questions);
        return created(res, session);

    } catch (err) {
        if (err instanceof z.ZodError) {
             throw badRequest("Invalid question format in JSON");
        }
        throw badRequest("Invalid JSON file");
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

quizLiveRouter.get("/:roomCode/", async (req, res) => {
    const { roomCode } = req.params;
    const session = await prisma.quizLiveSession.findUnique({
        where: { roomCode },
        include: {
            _count: {
                select: { participants: true }
            }
        }
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
