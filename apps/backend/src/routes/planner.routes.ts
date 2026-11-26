/**
 * Sphera Proactive Revision Planner routes — mounted at `/api/sphera/planner` and `/api/revision-plan`.
 *
 * Manages student subjects (matières), session-to-subject linking, active revision plans,
 * daily actionable task lists, task completion, and 1-click guilt-free rebalancing.
 */

import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, currentUser } from "../middleware/auth.js";
import { badRequest, notFound } from "../lib/errors.js";
import { created, ok } from "../lib/envelope.js";
import { parseSlugId } from "../lib/hashids.js";
import {
  buildRevisionSchedule,
  daysBetweenIso,
  extractSessionChapters,
  todayIsoDate,
  type SchedulerSubjectInput,
} from "../services/planner/revisionScheduler.js";

export const plannerRouter: Router = Router();
plannerRouter.use(requireAuth);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SUBJECT_COLORS = [
  "#22c55e", // emerald
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#ec4899", // pink
  "#14b8a6", // teal
];

const singleSubjectSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la matière est requis.").max(120),
  examDate: z.string().regex(ISO_DATE_RE, "Format de date attendu : AAAA-MM-JJ").nullable().optional(),
  exam_date: z.string().regex(ISO_DATE_RE, "Format de date attendu : AAAA-MM-JJ").nullable().optional(),
  weight: z.coerce.number().int().min(1).max(5).optional(),
  color: z.string().trim().max(32).optional(),
  sessionIds: z.array(z.coerce.number().int().positive()).optional(),
});

const createSubjectsPayloadSchema = z.union([
  z.object({
    subjects: z.array(singleSubjectSchema).min(1).max(20),
  }),
  singleSubjectSchema,
]);

const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  examDate: z.string().regex(ISO_DATE_RE).nullable().optional(),
  exam_date: z.string().regex(ISO_DATE_RE).nullable().optional(),
  weight: z.coerce.number().int().min(1).max(5).optional(),
  color: z.string().trim().max(32).optional(),
  sessionIds: z.array(z.coerce.number().int().positive()).optional(),
});

const generatePlanSchema = z.object({
  startDate: z.string().regex(ISO_DATE_RE).optional(),
  endDate: z.string().regex(ISO_DATE_RE).optional(),
  dailyLoad: z.coerce.number().int().min(1).max(3).optional(),
  restDays: z.array(z.coerce.number().int().min(0).max(6)).max(6).optional(),
});

const rebalancePlanSchema = z.object({
  date: z.string().regex(ISO_DATE_RE).optional(),
  dailyLoad: z.coerce.number().int().min(1).max(3).optional(),
  restDays: z.array(z.coerce.number().int().min(0).max(6)).max(6).optional(),
});

const toggleTaskSchema = z.object({
  isDone: z.boolean().optional(),
  is_done: z.boolean().optional(),
});

const linkSessionSchema = z.object({
  subjectId: z.coerce.number().int().positive().nullable().optional(),
  subject_id: z.coerce.number().int().positive().nullable().optional(),
});

function parseIdParam(req: Request, param = "id"): number {
  const parsed = parseSlugId(req.params[param]);
  if (!parsed) throw badRequest("Identifiant invalide.");
  return parsed;
}

function resolveClientToday(raw?: unknown): string {
  if (typeof raw === "string" && ISO_DATE_RE.test(raw.trim())) {
    return raw.trim();
  }
  return todayIsoDate();
}

function isTaskToolReady(
  actionType: string,
  session?: { toolTypes: string[]; ficheContent: unknown; content: unknown } | null,
): boolean {
  if (!session) return false;
  const tools = new Set(session.toolTypes.map((t) => t.toLowerCase()));
  const contentObj = (session.content ?? {}) as Record<string, unknown>;
  if (actionType === "fiche" || actionType === "relecture") {
    return Boolean(session.ficheContent || contentObj.fiche || tools.has("fiche"));
  }
  if (actionType === "flashcards") {
    return Boolean(contentObj.flashcards || tools.has("flashcards"));
  }
  if (actionType === "quiz") {
    return Boolean(contentObj.quiz || tools.has("quiz"));
  }
  return false;
}

function serializeTask(task: any) {
  const ready = isTaskToolReady(task.actionType, task.session);
  const sessionTitle =
    task.session?.resource?.title ||
    task.session?.sphereFile?.title ||
    task.session?.sourceFilename ||
    null;

  return {
    id: task.id,
    planId: task.planId,
    subjectId: task.subjectId,
    sessionId: task.sessionId,
    sessionTitle,
    scheduledDate: task.scheduledDate,
    phase: task.phase,
    actionType: task.actionType,
    chapterTitle: task.chapterTitle,
    label: task.label,
    estimatedMinutes: task.estimatedMinutes,
    isDone: task.isDone,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    position: task.position,
    isReady: ready,
    subject: task.subject
      ? {
          id: task.subject.id,
          name: task.subject.name,
          color: task.subject.color,
          examDate: task.subject.examDate,
          weight: task.subject.weight,
        }
      : null,
  };
}

async function loadSchedulerSubjects(
  ownerId: number,
  completedCountsBySubject?: Map<number, number>,
): Promise<SchedulerSubjectInput[]> {
  const subjects = await prisma.studySubject.findMany({
    where: { ownerId },
    include: {
      studySessions: {
        select: {
          id: true,
          sourceFilename: true,
          toolTypes: true,
          ficheContent: true,
          content: true,
          resource: { select: { title: true } },
          sphereFile: { select: { title: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ examDate: "asc" }, { weight: "desc" }, { createdAt: "asc" }],
  });

  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    examDate: s.examDate,
    weight: s.weight,
    alreadyCompletedCount: completedCountsBySubject?.get(s.id) ?? 0,
    sessions: s.studySessions.map((sess) => {
      const title =
        sess.resource?.title ||
        sess.sphereFile?.title ||
        sess.sourceFilename ||
        `Cours #${sess.id}`;
      return {
        id: sess.id,
        title,
        toolTypes: sess.toolTypes.map((t) => t.toLowerCase()),
        chapters: extractSessionChapters(sess.ficheContent, sess.content),
      };
    }),
  }));
}

async function serializeActivePlan(planId: number, todayStr: string) {
  const plan = await prisma.revisionPlan.findUnique({
    where: { id: planId },
    include: {
      tasks: {
        include: {
          subject: true,
          session: {
            select: {
              id: true,
              sourceFilename: true,
              toolTypes: true,
              ficheContent: true,
              content: true,
              resource: { select: { title: true } },
              sphereFile: { select: { title: true } },
            },
          },
        },
        orderBy: [{ scheduledDate: "asc" }, { position: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!plan) return null;

  const serializedTasks = plan.tasks.map(serializeTask);
  const daysMap = new Map<string, ReturnType<typeof serializeTask>[]>();

  let totalTasks = 0;
  let completedTasks = 0;
  let overdueCount = 0;

  for (const t of serializedTasks) {
    totalTasks++;
    if (t.isDone) completedTasks++;
    if (!t.isDone && t.scheduledDate < todayStr) overdueCount++;
    const bucket = daysMap.get(t.scheduledDate) ?? [];
    bucket.push(t);
    daysMap.set(t.scheduledDate, bucket);
  }

  const days = Array.from(daysMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tasks]) => ({
      date,
      isToday: date === todayStr,
      isPast: date < todayStr,
      tasks,
      doneCount: tasks.filter((t) => t.isDone).length,
      totalCount: tasks.length,
    }));

  return {
    id: plan.id,
    startDate: plan.startDate,
    endDate: plan.endDate,
    dailyLoad: plan.dailyLoad,
    restDays: Array.isArray(plan.restDays) ? plan.restDays : [],
    status: plan.status,
    generatedAt: plan.generatedAt.toISOString(),
    totalTasks,
    completedTasks,
    overdueCount,
    completionPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    days,
  };
}

// ── Subjects CRUD ────────────────────────────────────────────────────────────

plannerRouter.get("/subjects/", async (req, res) => {
  const me = currentUser(req);
  const todayStr = resolveClientToday(req.query.date);

  const [subjects, activePlan] = await Promise.all([
    prisma.studySubject.findMany({
      where: { ownerId: me.id },
      include: {
        studySessions: {
          select: {
            id: true,
            sourceFilename: true,
            toolTypes: true,
            resource: { select: { title: true } },
            sphereFile: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ examDate: "asc" }, { weight: "desc" }, { createdAt: "asc" }],
    }),
    prisma.revisionPlan.findFirst({
      where: { ownerId: me.id, status: "actif" },
      include: { tasks: { select: { subjectId: true, isDone: true } } },
      orderBy: { generatedAt: "desc" },
    }),
  ]);

  const progressBySubject = new Map<number, { done: number; total: number }>();
  for (const t of activePlan?.tasks ?? []) {
    const entry = progressBySubject.get(t.subjectId) ?? { done: 0, total: 0 };
    entry.total++;
    if (t.isDone) entry.done++;
    progressBySubject.set(t.subjectId, entry);
  }

  const data = subjects.map((s) => {
    const prog = progressBySubject.get(s.id) ?? { done: 0, total: 0 };
    const daysUntilExam = s.examDate ? daysBetweenIso(todayStr, s.examDate) : null;
    return {
      id: s.id,
      name: s.name,
      examDate: s.examDate,
      daysUntilExam,
      weight: s.weight,
      color: s.color,
      createdAt: s.createdAt.toISOString(),
      sessionsCount: s.studySessions.length,
      sessions: s.studySessions.map((sess) => ({
        id: sess.id,
        title: sess.resource?.title || sess.sphereFile?.title || sess.sourceFilename || `Cours #${sess.id}`,
        toolTypes: sess.toolTypes.map((t) => t.toLowerCase()),
      })),
      progress: {
        done: prog.done,
        total: prog.total,
        pct: prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0,
      },
    };
  });

  ok(res, data);
});

plannerRouter.post("/subjects/", async (req, res) => {
  const me = currentUser(req);
  const parsed = createSubjectsPayloadSchema.parse(req.body ?? {});
  const items = "subjects" in parsed ? parsed.subjects : [parsed];

  const existingCount = await prisma.studySubject.count({ where: { ownerId: me.id } });

  const createdSubjects = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const examDate = item.examDate ?? item.exam_date ?? null;
    const color = item.color || SUBJECT_COLORS[(existingCount + i) % SUBJECT_COLORS.length];

    const subject = await prisma.studySubject.create({
      data: {
        ownerId: me.id,
        name: item.name,
        examDate,
        weight: item.weight ?? 3,
        color,
      },
    });

    if (item.sessionIds && item.sessionIds.length > 0) {
      await prisma.studySession.updateMany({
        where: { id: { in: item.sessionIds }, ownerId: me.id },
        data: { subjectId: subject.id },
      });
    }

    createdSubjects.push(subject);
  }

  created(res, "subjects" in parsed ? createdSubjects : createdSubjects[0]);
});

plannerRouter.patch("/subjects/:id/", async (req, res) => {
  const me = currentUser(req);
  const id = parseIdParam(req);
  const input = updateSubjectSchema.parse(req.body ?? {});

  const existing = await prisma.studySubject.findFirst({ where: { id, ownerId: me.id } });
  if (!existing) throw notFound("Matière introuvable.");

  const nextExamDate =
    input.examDate !== undefined
      ? input.examDate
      : input.exam_date !== undefined
        ? input.exam_date
        : undefined;

  const updated = await prisma.studySubject.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(nextExamDate !== undefined ? { examDate: nextExamDate } : {}),
      ...(input.weight !== undefined ? { weight: input.weight } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
  });

  if (input.sessionIds !== undefined) {
    // Detach previous sessions for this subject, then attach the selected list
    await prisma.studySession.updateMany({
      where: { ownerId: me.id, subjectId: id, id: { notIn: input.sessionIds } },
      data: { subjectId: null },
    });
    if (input.sessionIds.length > 0) {
      await prisma.studySession.updateMany({
        where: { ownerId: me.id, id: { in: input.sessionIds } },
        data: { subjectId: id },
      });
    }
  }

  ok(res, updated);
});

plannerRouter.delete("/subjects/:id/", async (req, res) => {
  const me = currentUser(req);
  const id = parseIdParam(req);

  const existing = await prisma.studySubject.findFirst({ where: { id, ownerId: me.id } });
  if (!existing) throw notFound("Matière introuvable.");

  await prisma.studySubject.delete({ where: { id } });
  ok(res, { id }, "Matière supprimée.");
});

// ── Link / Unlink StudySession <-> StudySubject ──────────────────────────────

plannerRouter.patch("/sessions/:id/subject/", async (req, res) => {
  const me = currentUser(req);
  const sessionId = parseIdParam(req);
  const parsed = linkSessionSchema.parse(req.body ?? {});
  const subjectId = parsed.subjectId !== undefined ? parsed.subjectId : (parsed.subject_id ?? null);

  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, ownerId: me.id },
    select: { id: true },
  });
  if (!session) throw notFound("Session de cours introuvable.");

  if (subjectId !== null) {
    const subject = await prisma.studySubject.findFirst({
      where: { id: subjectId, ownerId: me.id },
      select: { id: true },
    });
    if (!subject) throw notFound("Matière introuvable.");
  }

  await prisma.studySession.update({
    where: { id: sessionId },
    data: { subjectId },
  });

  ok(res, { sessionId, subjectId });
});

// ── Plan Generation, Today View, Rebalance & Task Toggle ─────────────────────

plannerRouter.post("/plan/generate/", async (req, res) => {
  const me = currentUser(req);
  const input = generatePlanSchema.parse(req.body ?? {});
  const startDate = resolveClientToday(input.startDate);

  const subjects = await loadSchedulerSubjects(me.id);
  if (subjects.length === 0) {
    throw badRequest("Ajoute au moins une matière avant de générer ton plan de révision.");
  }

  const schedule = buildRevisionSchedule(subjects, {
    startDate,
    endDate: input.endDate,
    dailyLoad: input.dailyLoad ?? 2,
    restDays: input.restDays ?? [],
  });

  // Archive any previous active plans
  await prisma.revisionPlan.updateMany({
    where: { ownerId: me.id, status: "actif" },
    data: { status: "archive" },
  });

  const plan = await prisma.revisionPlan.create({
    data: {
      ownerId: me.id,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      dailyLoad: input.dailyLoad ?? 2,
      restDays: input.restDays ?? [],
      status: "actif",
      tasks: {
        create: schedule.tasks.map((t) => ({
          subjectId: t.subjectId,
          sessionId: t.sessionId,
          scheduledDate: t.scheduledDate,
          phase: t.phase,
          actionType: t.actionType,
          chapterTitle: t.chapterTitle,
          label: t.label,
          estimatedMinutes: t.estimatedMinutes,
          position: t.position,
        })),
      },
    },
  });

  const serialized = await serializeActivePlan(plan.id, startDate);
  created(res, serialized);
});

plannerRouter.post("/plan/rebalance/", async (req, res) => {
  const me = currentUser(req);
  const input = rebalancePlanSchema.parse(req.body ?? {});
  const todayStr = resolveClientToday(input.date);

  const activePlan = await prisma.revisionPlan.findFirst({
    where: { ownerId: me.id, status: "actif" },
    include: { tasks: true },
    orderBy: { generatedAt: "desc" },
  });
  if (!activePlan) throw notFound("Aucun plan de révision actif à rééquilibrer.");

  // Count already-completed tasks per subject so completed progress is respected
  const completedBySubject = new Map<number, number>();
  for (const t of activePlan.tasks) {
    if (t.isDone) {
      completedBySubject.set(t.subjectId, (completedBySubject.get(t.subjectId) ?? 0) + 1);
    }
  }

  const subjects = await loadSchedulerSubjects(me.id, completedBySubject);
  if (subjects.length === 0) {
    throw badRequest("Aucune matière disponible pour rééquilibrer le plan.");
  }

  const dailyLoad = input.dailyLoad ?? activePlan.dailyLoad;
  const restDays =
    input.restDays ?? (Array.isArray(activePlan.restDays) ? (activePlan.restDays as number[]) : []);

  const schedule = buildRevisionSchedule(subjects, {
    startDate: todayStr,
    dailyLoad,
    restDays,
  });

  // Preserve completed tasks; replace all incomplete tasks with fresh rebalanced schedule
  await prisma.$transaction([
    prisma.revisionTask.deleteMany({
      where: { planId: activePlan.id, isDone: false },
    }),
    prisma.revisionPlan.update({
      where: { id: activePlan.id },
      data: {
        endDate: schedule.endDate,
        dailyLoad,
        restDays,
      },
    }),
    prisma.revisionTask.createMany({
      data: schedule.tasks.map((t) => ({
        planId: activePlan.id,
        subjectId: t.subjectId,
        sessionId: t.sessionId,
        scheduledDate: t.scheduledDate,
        phase: t.phase,
        actionType: t.actionType,
        chapterTitle: t.chapterTitle,
        label: t.label,
        estimatedMinutes: t.estimatedMinutes,
        position: t.position,
      })),
    }),
  ]);

  const serialized = await serializeActivePlan(activePlan.id, todayStr);
  ok(res, serialized, "Ton plan a été rééquilibré à partir d'aujourd'hui !");
});

plannerRouter.get("/plan/", async (req, res) => {
  const me = currentUser(req);
  const todayStr = resolveClientToday(req.query.date);

  const activePlan = await prisma.revisionPlan.findFirst({
    where: { ownerId: me.id, status: "actif" },
    orderBy: { generatedAt: "desc" },
    select: { id: true },
  });

  if (!activePlan) {
    ok(res, null);
    return;
  }

  const serialized = await serializeActivePlan(activePlan.id, todayStr);
  ok(res, serialized);
});

plannerRouter.get("/today/", async (req, res) => {
  const me = currentUser(req);
  const todayStr = resolveClientToday(req.query.date);

  const [activePlan, subjects] = await Promise.all([
    prisma.revisionPlan.findFirst({
      where: { ownerId: me.id, status: "actif" },
      include: {
        tasks: {
          include: {
            subject: true,
            session: {
              select: {
                id: true,
                sourceFilename: true,
                toolTypes: true,
                ficheContent: true,
                content: true,
                resource: { select: { title: true } },
                sphereFile: { select: { title: true } },
              },
            },
          },
          orderBy: [{ scheduledDate: "asc" }, { position: "asc" }, { id: "asc" }],
        },
      },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.studySubject.findMany({
      where: { ownerId: me.id },
      orderBy: [{ examDate: "asc" }, { weight: "desc" }],
    }),
  ]);

  const upcomingExams = subjects
    .filter((s) => s.examDate && daysBetweenIso(todayStr, s.examDate) >= 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      examDate: s.examDate!,
      daysUntilExam: daysBetweenIso(todayStr, s.examDate!),
    }))
    .sort((a, b) => a.daysUntilExam - b.daysUntilExam)
    .slice(0, 4);

  if (!activePlan) {
    ok(res, {
      hasPlan: false,
      subjectsCount: subjects.length,
      date: todayStr,
      tasks: [],
      overdueCount: 0,
      upcomingExams,
      planProgress: null,
    });
    return;
  }

  const todayTasks = activePlan.tasks
    .filter((t) => t.scheduledDate === todayStr)
    .map(serializeTask);

  const overdueCount = activePlan.tasks.filter(
    (t) => !t.isDone && t.scheduledDate < todayStr,
  ).length;

  const totalTasks = activePlan.tasks.length;
  const completedTasks = activePlan.tasks.filter((t) => t.isDone).length;

  // Next scheduled study day if today is a rest day or has no tasks
  const nextTask = activePlan.tasks.find((t) => !t.isDone && t.scheduledDate > todayStr);

  ok(res, {
    hasPlan: true,
    planId: activePlan.id,
    subjectsCount: subjects.length,
    date: todayStr,
    tasks: todayTasks,
    overdueCount,
    nextStudyDate: nextTask?.scheduledDate ?? null,
    upcomingExams,
    planProgress: {
      completed: completedTasks,
      total: totalTasks,
      pct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  });
});

plannerRouter.patch("/tasks/:id/", async (req, res) => {
  const me = currentUser(req);
  const taskId = parseIdParam(req);
  const body = toggleTaskSchema.parse(req.body ?? {});

  const task = await prisma.revisionTask.findFirst({
    where: { id: taskId, plan: { ownerId: me.id } },
    include: {
      subject: true,
      session: {
        select: {
          id: true,
          sourceFilename: true,
          toolTypes: true,
          ficheContent: true,
          content: true,
          resource: { select: { title: true } },
          sphereFile: { select: { title: true } },
        },
      },
    },
  });

  if (!task) throw notFound("Tâche de révision introuvable.");

  const nextDone =
    body.isDone !== undefined
      ? body.isDone
      : body.is_done !== undefined
        ? body.is_done
        : !task.isDone;

  const updated = await prisma.revisionTask.update({
    where: { id: taskId },
    data: {
      isDone: nextDone,
      completedAt: nextDone ? new Date() : null,
    },
    include: {
      subject: true,
      session: {
        select: {
          id: true,
          sourceFilename: true,
          toolTypes: true,
          ficheContent: true,
          content: true,
          resource: { select: { title: true } },
          sphereFile: { select: { title: true } },
        },
      },
    },
  });

  ok(res, serializeTask(updated));
});
