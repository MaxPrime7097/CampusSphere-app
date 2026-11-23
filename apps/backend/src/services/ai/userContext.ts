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

  // Include context as long as at least one meaningful academic field is present
  if (!context.university && !context.faculty && !context.studyYear) {
    return "";
  }

  const parts: string[] = [];
  if (context.faculty) parts.push(`studying ${context.faculty}`);
  if (context.studyYear) parts.push(`level: ${context.studyYear}`);
  if (context.university) parts.push(`at ${context.university}`);

  const namePart = context.firstName ? `Student name: ${context.firstName}, ` : "";
  return `[STUDENT PROFILE: ${namePart}${parts.join(", ")}. Use this background to calibrate pedagogical depth and keep explanations accessible. Do not repeat greetings at every turn, and do not recite academic profile details unless genuinely relevant.]\n\n`;
}

export interface SpheraUserPreferences {
  defaultLanguage: string;
  detailLevel: string;
  tone: string;
  quizQuestionCount: number | null;
  quizTimeLimit: number;
  flashcardCount: number | null;
  theme: string;
}

const prefsCache = new Map<number, { prefs: SpheraUserPreferences | null; expiresAt: number }>();

export async function getUserPreferences(userId: number): Promise<SpheraUserPreferences | null> {
  const cached = prefsCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.prefs;
  }

  try {
    const record = await prisma.spheraPreferences.findUnique({
      where: { userId },
    });
    const result: SpheraUserPreferences | null = record
      ? {
          defaultLanguage: record.defaultLanguage,
          detailLevel: record.detailLevel,
          tone: record.tone,
          quizQuestionCount: record.quizQuestionCount,
          quizTimeLimit: record.quizTimeLimit,
          flashcardCount: record.flashcardCount,
          theme: record.theme,
        }
      : null;
    prefsCache.set(userId, { prefs: result, expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS });
    return result;
  } catch (err) {
    console.warn("[sphera-ai] Failed to load preferences:", err);
    return null;
  }
}

export function invalidatePreferencesCache(userId: number): void {
  prefsCache.delete(userId);
}

export function buildStyleInstructions(prefs: SpheraUserPreferences | null): string {
  if (!prefs) return "";
  const parts: string[] = [];

  if (prefs.detailLevel === "court") {
    parts.push("Be concise and high-yield: focus directly on essential concepts without digressions or filler.");
  } else if (prefs.detailLevel === "detaille") {
    parts.push("Be thorough, rigorous, and comprehensive: explain each concept, mechanism, nuance, and sub-concept in depth.");
  }

  if (prefs.tone === "formel") {
    parts.push("Adopt a rigorous, formal academic tone appropriate for university-level study.");
  }

  if (prefs.defaultLanguage === "fr") {
    parts.push("CRITICAL LANGUAGE OVERRIDE: Respond strictly and entirely in French.");
  } else if (prefs.defaultLanguage === "en") {
    parts.push("CRITICAL LANGUAGE OVERRIDE: Formulate all content strictly and entirely in English.");
  }

  return parts.length ? `[STUDENT PREFERENCES: ${parts.join(" ")}]\n\n` : "";
}