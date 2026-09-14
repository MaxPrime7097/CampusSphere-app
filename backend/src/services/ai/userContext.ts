import { prisma } from "../../lib/prisma.js";

export interface AcademicContext {
  firstName: string;
  university: string | null;
  faculty: string | null;
  studyYear: string | null;
  language: string | null;
}

/** Strip newlines, control characters, and cap length to prevent prompt injection via profile fields. */
function sanitizeField(value: string | null | undefined, maxLength = 80): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[\n\r\t]/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "")
    .trim()
    .slice(0, maxLength);
  return cleaned || null;
}

const contextCache = new Map<number, { context: AcademicContext | null; expiresAt: number }>();
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getUserAcademicContext(userId: number): Promise<AcademicContext | null> {
  const cached = contextCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.context;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      university: true,
      faculty: true,
      studyYear: true,
      language: true,
    },
  });

  if (!user) {
    contextCache.set(userId, { context: null, expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS });
    return null;
  }

  const result: AcademicContext = {
    firstName: sanitizeField(user.firstName, 50) ?? user.firstName,
    university: sanitizeField(user.university),
    faculty: sanitizeField(user.faculty),
    studyYear: sanitizeField(user.studyYear, 30),
    language: typeof user.language === "string" ? user.language : "fr",
  };

  contextCache.set(userId, { context: result, expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS });
  return result;
}

export function buildContextPrefix(context: AcademicContext | null): string {
  if (!context) return "";

  // Include context as long as at least one meaningful field is present
  if (!context.university && !context.faculty && !context.studyYear) {
    return "";
  }

  const isFrench = !context.language || context.language === "fr";

  const parts: string[] = [];
  if (isFrench) {
    if (context.firstName) parts.push(`l'étudiant(e) ${context.firstName}`);
    if (context.faculty) parts.push(`en ${context.faculty}`);
    if (context.studyYear) parts.push(`niveau ${context.studyYear}`);
    if (context.university) parts.push(`à ${context.university}`);
    return `Contexte : tu aides ${parts.join(", ")}. Adapte ton vocabulaire et tes exemples à ce niveau d'études.\n\n`;
  } else {
    if (context.firstName) parts.push(`student ${context.firstName}`);
    if (context.faculty) parts.push(`studying ${context.faculty}`);
    if (context.studyYear) parts.push(`level: ${context.studyYear}`);
    if (context.university) parts.push(`at ${context.university}`);
    return `Context: you are helping ${parts.join(", ")}. Adapt your vocabulary and examples to this study level.\n\n`;
  }
}