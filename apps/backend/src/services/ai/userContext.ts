import { prisma } from "../../lib/prisma.js";
import { daysBetweenIso, todayIsoDate } from "../planner/revisionScheduler.js";

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

/** Sanitize student-authored learning memory notes (max 10 notes, max 140 chars each). */
export function sanitizeLearningNotes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const safe = sanitizeField(item, 140);
    if (!safe) continue;
    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(safe);
    if (cleaned.length >= 10) break;
  }
  return cleaned;
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
  memoryEnabled: boolean;
  learningNotes: string[];
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
          memoryEnabled: record.memoryEnabled ?? true,
          learningNotes: sanitizeLearningNotes(record.learningNotes),
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
  learningMemoryCache.delete(userId);
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

// ─── Adaptive Learning Memory (Exams, Mastery Weaknesses, Today's Plan & Custom Notes) ───

export interface LearningMemorySnapshot {
  enabled: boolean;
  learningNotes: string[];
  upcomingExams: Array<{
    id: number;
    name: string;
    color: string;
    examDate: string;
    daysUntil: number;
    weight: number;
  }>;
  weakCourses: Array<{
    sessionId: number;
    title: string;
    score: number;
    subjectName: string | null;
  }>;
  strongCourses: Array<{
    sessionId: number;
    title: string;
    score: number;
  }>;
  todayTasks: Array<{
    id: number;
    label: string;
    actionType: string;
    subjectName: string | null;
    isOverdue: boolean;
  }>;
}

const learningMemoryCache = new Map<number, { snapshot: LearningMemorySnapshot; expiresAt: number }>();

export function invalidateLearningMemoryCache(userId: number): void {
  learningMemoryCache.delete(userId);
}

function computeMasteryScore(row: {
  lastQuizScore: number | null;
  flashcardsMastered: number;
  flashcardsTotal: number;
}): number | null {
  const parts: number[] = [];
  if (typeof row.lastQuizScore === "number") {
    parts.push(Math.max(0, Math.min(100, row.lastQuizScore)));
  }
  if (row.flashcardsTotal > 0) {
    parts.push(Math.max(0, Math.min(100, Math.round((row.flashcardsMastered / row.flashcardsTotal) * 100))));
  }
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/**
 * Assemble a compact, live adaptive learning snapshot for the student from
 * StudySubject (exams), StudyProgress (quiz/flashcards mastery), active RevisionPlan
 * (today & overdue tasks), and custom SpheraPreferences.learningNotes.
 */
export async function getUserLearningMemory(userId: number): Promise<LearningMemorySnapshot> {
  const cached = learningMemoryCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.snapshot;
  }

  const today = todayIsoDate();

  const [prefs, subjects, progresses, activePlan] = await Promise.all([
    getUserPreferences(userId),
    prisma.studySubject.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, color: true, examDate: true, weight: true },
    }),
    prisma.studyProgress.findMany({
      where: { userId },
      include: {
        session: {
          select: {
            id: true,
            sourceFilename: true,
            resource: { select: { title: true } },
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    prisma.revisionPlan.findFirst({
      where: { ownerId: userId, status: "actif" },
      include: {
        tasks: {
          where: { isDone: false, scheduledDate: { lte: today } },
          include: { subject: { select: { name: true } } },
          orderBy: [{ scheduledDate: "asc" }, { position: "asc" }],
          take: 5,
        },
      },
    }),
  ]);

  const upcomingExams = subjects
    .filter((s) => Boolean(s.examDate))
    .map((s) => ({
      id: s.id,
      name: sanitizeField(s.name, 70) ?? s.name,
      color: s.color || "#22c55e",
      examDate: s.examDate!,
      daysUntil: daysBetweenIso(today, s.examDate!),
      weight: s.weight,
    }))
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 21)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 4);

  const scoredCourses = progresses
    .filter(
      (p) =>
        p.session &&
        p.session.sourceFilename !== "__sphera_standalone_chat__" &&
        p.session.sourceFilename !== "Discussion libre",
    )
    .map((p) => {
      const score = computeMasteryScore(p);
      const rawTitle = p.session.resource?.title || p.session.sourceFilename || `Cours #${p.sessionId}`;
      return {
        sessionId: p.sessionId,
        title: sanitizeField(rawTitle, 70) ?? rawTitle,
        score,
        subjectName: sanitizeField(p.session.subject?.name, 50),
      };
    })
    .filter((c): c is { sessionId: number; title: string; score: number; subjectName: string | null } => c.score !== null);

  const weakCourses = scoredCourses
    .filter((c) => c.score < 65)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const strongCourses = scoredCourses
    .filter((c) => c.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ sessionId, title, score }) => ({ sessionId, title, score }));

  const todayTasks = (activePlan?.tasks ?? []).map((t) => ({
    id: t.id,
    label: sanitizeField(t.label, 90) ?? t.label,
    actionType: t.actionType,
    subjectName: sanitizeField(t.subject?.name, 50),
    isOverdue: t.scheduledDate < today,
  }));

  const snapshot: LearningMemorySnapshot = {
    enabled: prefs?.memoryEnabled ?? true,
    learningNotes: prefs?.learningNotes ?? [],
    upcomingExams,
    weakCourses,
    strongCourses,
    todayTasks,
  };

  learningMemoryCache.set(userId, { snapshot, expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS });
  return snapshot;
}

/**
 * Format the adaptive learning snapshot into a compact, unobtrusive system prefix
 * for conversational Q&A / Chat.
 */
export function buildLearningMemoryPrefix(snapshot: LearningMemorySnapshot | null): string {
  if (!snapshot || !snapshot.enabled) return "";

  const lines: string[] = [];

  if (snapshot.upcomingExams.length > 0) {
    const examsStr = snapshot.upcomingExams
      .map((e) => {
        const when = e.daysUntil === 0 ? "today" : e.daysUntil === 1 ? "tomorrow" : `in ${e.daysUntil} days`;
        return `${e.name} (${when}, priority ${e.weight}/5)`;
      })
      .join("; ");
    lines.push(`- Upcoming exams: ${examsStr}.`);
  }

  if (snapshot.weakCourses.length > 0) {
    const weakStr = snapshot.weakCourses
      .map((c) => `${c.title}${c.subjectName ? ` [${c.subjectName}]` : ""} (${c.score}% mastery)`)
      .join("; ");
    lines.push(`- Courses needing reinforcement: ${weakStr}.`);
  }

  if (snapshot.strongCourses.length > 0) {
    const strongStr = snapshot.strongCourses.map((c) => `${c.title} (${c.score}%)`).join("; ");
    lines.push(`- Mastered strengths: ${strongStr}.`);
  }

  if (snapshot.todayTasks.length > 0) {
    const tasksStr = snapshot.todayTasks
      .slice(0, 4)
      .map((t) => `${t.label}${t.subjectName ? ` [${t.subjectName}]` : ""}${t.isOverdue ? " (overdue)" : ""}`)
      .join("; ");
    lines.push(`- Planned revisions due today: ${tasksStr}.`);
  }

  if (snapshot.learningNotes.length > 0) {
    const notesStr = snapshot.learningNotes.map((n) => `"${n}"`).join("; ");
    lines.push(`- Student's explicit learning preferences & memory notes: ${notesStr}.`);
  }

  if (lines.length === 0) return "";

  return (
    `[ADAPTIVE LEARNING MEMORY:\n` +
    `${lines.join("\n")}\n` +
    `RULES: Use this background subtly to calibrate explanation depth, examples, and exam focus. ` +
    `ALWAYS honor the student's explicit learning preferences/notes when explaining. ` +
    `Do NOT recite or dump their exams, scores, or planned tasks unprompted unless relevant to their topic or they explicitly ask (e.g. "what should I revise today?").]\n\n`
  );
}
