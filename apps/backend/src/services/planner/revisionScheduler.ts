/**
 * Deterministic Pedagogical Revision Scheduler (V1.5)
 *
 * Pure, timezone-safe (YYYY-MM-DD) scheduling engine that combines:
 * 1. Normalized exam urgency × declared importance weight (dated upcoming exams
 *    always properly outrank undated subjects when deadlines approach).
 * 2. Recency / spaced-interleaving multiplier (prevents scheduling the same 3
 *    subjects every day while neglecting others).
 * 3. Cognitive 3-phase progression per subject/course:
 *      decouverte (fiche / chapters) -> ancrage (flashcards) -> validation (quiz / relecture)
 * 4. Actionable chapter-level tasks whenever a linked StudySession already has a
 *    structured fiche (`chapitres`), or clear prompts when no course is linked yet.
 */

export type PlannerPhase = "decouverte" | "ancrage" | "validation";
export type PlannerActionType = "fiche" | "flashcards" | "quiz" | "annale" | "relecture";

export interface SchedulerSessionInput {
  id: number;
  title: string;
  toolTypes: string[];
  chapters: string[];
}

export interface SchedulerSubjectInput {
  id: number;
  name: string;
  examDate: string | null; // YYYY-MM-DD or null
  weight: number; // 1..5
  sessions: SchedulerSessionInput[];
  alreadyCompletedCount?: number;
}

export interface ScheduledTaskDraft {
  subjectId: number;
  sessionId: number | null;
  scheduledDate: string; // YYYY-MM-DD
  phase: PlannerPhase;
  actionType: PlannerActionType;
  chapterTitle: string | null;
  label: string;
  estimatedMinutes: number;
  position: number;
}

export interface ScheduleOptions {
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  dailyLoad?: number; // 1..3
  restDays?: number[]; // 0=Sun..6=Sat
}

const MAX_PLAN_DAYS = 60;
const DEFAULT_PLAN_DAYS = 14;

/** Parse YYYY-MM-DD into a UTC noon Date so arithmetic never drifts on DST. */
export function parseIsoDate(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) throw new Error(`Invalid ISO date: ${dateStr}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
}

export function formatIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(dateStr: string, days: number): string {
  const d = parseIsoDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatIsoDate(d);
}

export function daysBetweenIso(fromStr: string, toStr: string): number {
  const a = parseIsoDate(fromStr).getTime();
  const b = parseIsoDate(toStr).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export function weekdayOfIso(dateStr: string): number {
  return parseIsoDate(dateStr).getUTCDay(); // 0=Sun..6=Sat
}

/**
 * Compute normalized urgency score for a subject on `currentDate`.
 *
 * Guarantees:
 * - Passed exams (daysUntilExam < 0) return 0.
 * - Exam day itself (daysUntilExam === 0) returns 0 unless caller explicitly allows it.
 * - Upcoming exams within 2 weeks strictly outrank undated subjects of equal weight.
 * - Recency multiplier ensures fair spaced interleaving across all subjects.
 */
export function computeSubjectPriority(
  subject: Pick<SchedulerSubjectInput, "examDate" | "weight">,
  currentDate: string,
  daysSinceLastScheduled: number,
  scheduledCountSoFar: number,
): number {
  const weight = Math.max(1, Math.min(5, Math.round(subject.weight || 3)));
  const weightFactor = 0.65 + 0.35 * weight; // 1.0 (w=1) .. 2.4 (w=5)

  let urgencyBase: number;
  if (subject.examDate) {
    const daysUntil = daysBetweenIso(currentDate, subject.examDate);
    if (daysUntil <= 0) return 0; // Exam already passed or is today
    if (daysUntil === 1) {
      urgencyBase = 18; // Exam eve: top priority
    } else if (daysUntil === 2) {
      urgencyBase = 11;
    } else {
      // Smoothly decays from ~5.0 at J-3 to ~1.5 at J-10 and ~0.75 at J-20
      urgencyBase = 15 / daysUntil;
    }
  } else {
    // Undated subject: steady baseline (always below an exam within 15 days)
    urgencyBase = 0.85;
  }

  // Spaced-interleaving recency multiplier:
  // Scheduled yesterday (1 day ago) -> 0.65; 2 days ago -> 1.15; 3+ days ago -> up to 2.15
  const recencyMultiplier = 0.3 + 0.42 * Math.min(Math.max(daysSinceLastScheduled, 1), 5);

  // Mild balance damping so no single subject starves others over a long plan
  const loadBalance = 1 / (1 + scheduledCountSoFar * 0.12);

  return urgencyBase * weightFactor * recencyMultiplier * loadBalance;
}

/** Extract chapter titles from a StudySession's ficheContent or content.fiche. */
export function extractSessionChapters(ficheContent: unknown, content: unknown): string[] {
  const candidates = [
    (ficheContent as any)?.chapitres,
    (ficheContent as any)?.fiche?.chapitres,
    (content as any)?.fiche?.chapitres,
    (content as any)?.fiche_content?.chapitres,
  ];
  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0) {
      return list
        .map((c: any, idx: number) => {
          const titre = typeof c?.titre === "string" ? c.titre.trim() : "";
          const num = c?.numero ?? idx + 1;
          return titre ? `Chap. ${num} — ${titre}` : "";
        })
        .filter(Boolean);
    }
  }
  return [];
}

/** Resolve default endDate from subjects' upcoming exam dates (or startDate + 14d). */
export function resolvePlanEndDate(
  subjects: SchedulerSubjectInput[],
  startDate: string,
  explicitEndDate?: string,
): string {
  if (explicitEndDate && daysBetweenIso(startDate, explicitEndDate) >= 1) {
    const span = Math.min(daysBetweenIso(startDate, explicitEndDate), MAX_PLAN_DAYS);
    return addDaysIso(startDate, span);
  }

  let latestExam: string | null = null;
  for (const s of subjects) {
    if (!s.examDate) continue;
    if (daysBetweenIso(startDate, s.examDate) >= 1) {
      if (!latestExam || s.examDate > latestExam) {
        latestExam = s.examDate;
      }
    }
  }

  if (latestExam) {
    const span = Math.max(1, Math.min(daysBetweenIso(startDate, latestExam), MAX_PLAN_DAYS));
    return addDaysIso(startDate, span);
  }

  return addDaysIso(startDate, DEFAULT_PLAN_DAYS);
}

interface SubjectWorkUnit {
  sessionId: number | null;
  sessionTitle: string | null;
  phase: PlannerPhase;
  actionType: PlannerActionType;
  chapterTitle: string | null;
  label: string;
  estimatedMinutes: number;
}

/**
 * Build an ordered pedagogical study queue for a subject:
 *   Discovery (chapters/fiche) -> Anchoring (flashcards) -> Validation (quiz / review)
 */
function buildSubjectCurriculum(subject: SchedulerSubjectInput): SubjectWorkUnit[] {
  const units: SubjectWorkUnit[] = [];

  if (subject.sessions.length === 0) {
    units.push(
      {
        sessionId: null,
        sessionTitle: null,
        phase: "decouverte",
        actionType: "fiche",
        chapterTitle: null,
        label: `Importer un cours de ${subject.name} et lire la fiche`,
        estimatedMinutes: 25,
      },
      {
        sessionId: null,
        sessionTitle: null,
        phase: "ancrage",
        actionType: "flashcards",
        chapterTitle: null,
        label: `Mémoriser les notions clés de ${subject.name} (Flashcards)`,
        estimatedMinutes: 15,
      },
      {
        sessionId: null,
        sessionTitle: null,
        phase: "validation",
        actionType: "quiz",
        chapterTitle: null,
        label: `Se tester sur ${subject.name} (Quiz d'entraînement)`,
        estimatedMinutes: 20,
      },
    );
    return units;
  }

  // 1. Discovery phase: cover chapters in digestible chunks (1-2 chapters per session)
  for (const sess of subject.sessions) {
    if (sess.chapters.length >= 2) {
      for (let i = 0; i < sess.chapters.length; i += 2) {
        const chunk = sess.chapters.slice(i, i + 2);
        const chapterLabel =
          chunk.length === 2
            ? `${chunk[0].split(" — ")[0]} & ${chunk[1].split(" — ")[0]}`
            : chunk[0];
        units.push({
          sessionId: sess.id,
          sessionTitle: sess.title,
          phase: "decouverte",
          actionType: "fiche",
          chapterTitle: chunk.join(" · "),
          label: `${chapterLabel} — Comprendre la fiche (${sess.title})`,
          estimatedMinutes: chunk.length === 2 ? 25 : 15,
        });
      }
    } else {
      units.push({
        sessionId: sess.id,
        sessionTitle: sess.title,
        phase: "decouverte",
        actionType: "fiche",
        chapterTitle: sess.chapters[0] ?? null,
        label: `Lire et maîtriser la fiche — ${sess.title}`,
        estimatedMinutes: 20,
      });
    }
  }

  // 2. Anchoring phase: Active Recall via Flashcards per course
  for (const sess of subject.sessions) {
    units.push({
      sessionId: sess.id,
      sessionTitle: sess.title,
      phase: "ancrage",
      actionType: "flashcards",
      chapterTitle: null,
      label: `Ancrage mémoire : Cartes mémoire — ${sess.title}`,
      estimatedMinutes: 15,
    });
  }

  // 3. Validation phase: Timed Quiz per course
  for (const sess of subject.sessions) {
    units.push({
      sessionId: sess.id,
      sessionTitle: sess.title,
      phase: "validation",
      actionType: "quiz",
      chapterTitle: null,
      label: `Test de validation : Quiz — ${sess.title}`,
      estimatedMinutes: 20,
    });
  }

  return units;
}

/**
 * Pick the next pedagogical task for a subject, adapting to exam proximity:
 * - On exam eve (J-1 or J-2), prioritize validation/quiz or quick synthesis review
 *   if at least one discovery step has already happened.
 */
function pickNextWorkUnit(
  subject: SchedulerSubjectInput,
  curriculum: SubjectWorkUnit[],
  cursor: number,
  currentDate: string,
): SubjectWorkUnit {
  const daysUntilExam = subject.examDate ? daysBetweenIso(currentDate, subject.examDate) : null;

  // Exam eve / J-2: prioritize exam simulation (quiz) or targeted active recall
  if (daysUntilExam !== null && daysUntilExam <= 2 && cursor > 0) {
    const validationUnit = curriculum.find((u) => u.phase === "validation");
    if (validationUnit) {
      if (daysUntilExam === 1) {
        return {
          ...validationUnit,
          actionType: "quiz",
          phase: "validation",
          label: validationUnit.sessionTitle
            ? `Simulation veille d'examen : Quiz & Mémento (${validationUnit.sessionTitle})`
            : `Révision finale veille d'examen — ${subject.name}`,
          estimatedMinutes: 25,
        };
      }
      return validationUnit;
    }
  }

  if (cursor < curriculum.length) {
    return curriculum[cursor];
  }

  // Spaced repetition cycle once the initial curriculum is completed:
  // alternate Flashcards (anchoring) -> Quiz (validation) -> Fiche Mémento review
  const cycleIdx = (cursor - curriculum.length) % 3;
  const sess = subject.sessions.length > 0 ? subject.sessions[cursor % subject.sessions.length] : null;
  if (cycleIdx === 0) {
    return {
      sessionId: sess?.id ?? null,
      sessionTitle: sess?.title ?? null,
      phase: "ancrage",
      actionType: "flashcards",
      chapterTitle: null,
      label: sess
        ? `Répétition espacée : Cartes à revoir — ${sess.title}`
        : `Répétition espacée (Flashcards) — ${subject.name}`,
      estimatedMinutes: 15,
    };
  }
  if (cycleIdx === 1) {
    return {
      sessionId: sess?.id ?? null,
      sessionTitle: sess?.title ?? null,
      phase: "validation",
      actionType: "quiz",
      chapterTitle: null,
      label: sess
        ? `Refaire un Quiz ciblé — ${sess.title}`
        : `Test de validation (Quiz) — ${subject.name}`,
      estimatedMinutes: 20,
    };
  }
  return {
    sessionId: sess?.id ?? null,
    sessionTitle: sess?.title ?? null,
    phase: "validation",
    actionType: "fiche",
    chapterTitle: null,
    label: sess
      ? `Relecture Mémento & Auto-éval — ${sess.title}`
      : `Relecture express & définitions — ${subject.name}`,
    estimatedMinutes: 15,
  };
}

/**
 * Generate a complete, balanced, pedagogically ordered revision schedule.
 */
export function buildRevisionSchedule(
  subjects: SchedulerSubjectInput[],
  options: ScheduleOptions,
): { startDate: string; endDate: string; tasks: ScheduledTaskDraft[] } {
  const startDate = options.startDate;
  const endDate = resolvePlanEndDate(subjects, startDate, options.endDate);
  const dailyLoad = Math.max(1, Math.min(3, Math.round(options.dailyLoad ?? 2)));
  const restDays = new Set((options.restDays ?? []).filter((d) => d >= 0 && d <= 6));

  if (subjects.length === 0) {
    return { startDate, endDate, tasks: [] };
  }

  const totalDays = Math.max(1, Math.min(daysBetweenIso(startDate, endDate) + 1, MAX_PLAN_DAYS));

  // Precompute curricula and tracking state per subject
  const curricula = new Map<number, SubjectWorkUnit[]>();
  const cursors = new Map<number, number>();
  const lastScheduledDay = new Map<number, number>();
  const scheduledCounts = new Map<number, number>();

  for (const s of subjects) {
    curricula.set(s.id, buildSubjectCurriculum(s));
    cursors.set(s.id, s.alreadyCompletedCount ?? 0);
    lastScheduledDay.set(s.id, -3); // Neutral initial recency
    scheduledCounts.set(s.id, s.alreadyCompletedCount ?? 0);
  }

  const tasks: ScheduledTaskDraft[] = [];

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDaysIso(startDate, dayOffset);
    const weekday = weekdayOfIso(currentDate);

    // Honor rest days UNLESS a subject has an exam tomorrow (J-1)
    const hasExamTomorrow = subjects.some(
      (s) => s.examDate && daysBetweenIso(currentDate, s.examDate) === 1,
    );
    if (restDays.has(weekday) && !hasExamTomorrow) {
      continue;
    }

    // Rank eligible subjects for today
    const ranked = subjects
      .map((subject) => {
        const daysSince = dayOffset - (lastScheduledDay.get(subject.id) ?? -3);
        const count = scheduledCounts.get(subject.id) ?? 0;
        const score = computeSubjectPriority(subject, currentDate, daysSince, count);
        return { subject, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) continue;

    // Pick up to `dailyLoad` distinct subjects for today (or if only 1 subject exists
    // and exam is <= 5 days away, allow up to `dailyLoad` tasks for that subject!)
    const selectedSubjects: SchedulerSubjectInput[] = [];
    const maxSlotsToday =
      ranked.length === 1
        ? ranked[0].subject.examDate && daysBetweenIso(currentDate, ranked[0].subject.examDate) <= 5
          ? Math.min(dailyLoad, 2)
          : 1
        : Math.min(dailyLoad, ranked.length);

    if (ranked.length === 1) {
      for (let k = 0; k < maxSlotsToday; k++) {
        selectedSubjects.push(ranked[0].subject);
      }
    } else {
      for (let k = 0; k < maxSlotsToday; k++) {
        selectedSubjects.push(ranked[k].subject);
      }
    }

    selectedSubjects.forEach((subject, pos) => {
      const curriculum = curricula.get(subject.id)!;
      const cursor = cursors.get(subject.id) ?? 0;
      const unit = pickNextWorkUnit(subject, curriculum, cursor, currentDate);

      tasks.push({
        subjectId: subject.id,
        sessionId: unit.sessionId,
        scheduledDate: currentDate,
        phase: unit.phase,
        actionType: unit.actionType,
        chapterTitle: unit.chapterTitle,
        label: unit.label,
        estimatedMinutes: unit.estimatedMinutes,
        position: pos,
      });

      cursors.set(subject.id, cursor + 1);
      lastScheduledDay.set(subject.id, dayOffset);
      scheduledCounts.set(subject.id, (scheduledCounts.get(subject.id) ?? 0) + 1);
    });
  }

  return { startDate, endDate, tasks };
}
