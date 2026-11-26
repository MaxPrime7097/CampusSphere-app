/**
 * Proactive Daily & Exam-Countdown Revision Reminders.
 *
 * Runs on the backend scheduler (guarded by Redis claimPeriod) and sends at most
 * ONE gentle reminder per student per day when:
 *   - They have pending revision tasks scheduled for today, OR
 *   - One of their declared subjects has an exam in 3 days (J-3), tomorrow (J-1), or today (J-0).
 *
 * Delivery:
 *   1. In-app Notification (`NotificationType.SYSTEM`) pushed over WebSocket + bell.
 *   2. Best-effort morning email if SMTP is configured and `systemUpdates` is enabled.
 */

import { NotificationType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { createNotification } from "../notifications.js";
import { sendRevisionReminderEmail } from "../email.js";
import { daysBetweenIso, todayIsoDate } from "./revisionScheduler.js";

export interface ReminderSummaryInput {
  todayTasks: Array<{ subjectName: string; label: string; estimatedMinutes: number }>;
  upcomingExams: Array<{ name: string; daysUntilExam: number }>;
}

export interface ReminderSummaryPayload {
  title: string;
  message: string;
  emailSubject: string;
  emailHeading: string;
  emailIntro: string;
}

/** Pure helper building crisp, encouraging reminder copy (unit-testable). */
export function buildRevisionReminderPayload(
  input: ReminderSummaryInput,
): ReminderSummaryPayload | null {
  const { todayTasks, upcomingExams } = input;
  const urgentExams = upcomingExams.filter(
    (e) => e.daysUntilExam === 3 || e.daysUntilExam === 1 || e.daysUntilExam === 0,
  );

  if (todayTasks.length === 0 && urgentExams.length === 0) {
    return null;
  }

  const totalMin = todayTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 20), 0);

  if (urgentExams.length > 0) {
    const primary = urgentExams[0];
    const countdownLabel =
      primary.daysUntilExam === 0
        ? "aujourd'hui"
        : primary.daysUntilExam === 1
          ? "demain (J-1)"
          : `dans 3 jours (J-3)`;

    const title = `Examen ${primary.name} ${countdownLabel}`;
    const taskSuffix =
      todayTasks.length > 0
        ? ` Tu as ${todayTasks.length} séance${todayTasks.length > 1 ? "s" : ""} prévue${todayTasks.length > 1 ? "s" : ""} aujourd'hui (~${totalMin} min).`
        : " Passe un dernier coup d'œil à ton mémento et tes flashcards !";

    return {
      title,
      message: `Ton examen de ${primary.name} arrive ${countdownLabel}.${taskSuffix}`,
      emailSubject: `Sphera · ${title}`,
      emailHeading: title,
      emailIntro: `Ton échéance de ${primary.name} approche (${countdownLabel}). Voici de quoi rester serein et efficace aujourd'hui :`,
    };
  }

  const count = todayTasks.length;
  const subjectsList = Array.from(new Set(todayTasks.map((t) => t.subjectName))).slice(0, 3).join(", ");
  const title = `Ton programme Sphera du jour (${count} séance${count > 1 ? "s" : ""})`;
  const message = `${subjectsList} · environ ${totalMin} min au total. Clique pour lancer ta première séance.`;

  return {
    title,
    message,
    emailSubject: `Sphera · ${title}`,
    emailHeading: "Prêt pour ta session du jour ?",
    emailIntro: `Sphera a préparé ${count} séance${count > 1 ? "s" : ""} rapide${count > 1 ? "s" : ""} (~${totalMin} min) pour avancer sereinement vers tes partiels :`,
  };
}

/**
 * Scheduled job entry point: sends proactive morning & J-3/J-1 revision reminders.
 * Safe to invoke hourly — deduplicates strictly per user per calendar day.
 */
export async function sendDailyRevisionReminders(now = new Date()): Promise<number> {
  // Trigger in the morning window (07:00-11:59 UTC) so students get their daily plan in the morning
  const utcHour = now.getUTCHours();
  if (utcHour < 7 || utcHour > 12) {
    return 0;
  }

  const todayStr = todayIsoDate();

  const activePlans = await prisma.revisionPlan.findMany({
    where: { status: "actif" },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          username: true,
          isActive: true,
          notificationSetting: true,
        },
      },
      tasks: {
        where: { scheduledDate: todayStr, isDone: false },
        include: { subject: { select: { name: true } } },
        orderBy: { position: "asc" },
      },
    },
  });

  if (activePlans.length === 0) return 0;

  // Deduplicate by user (keep most recent active plan if multiple exist)
  const plansByUser = new Map<number, (typeof activePlans)[number]>();
  for (const p of activePlans) {
    if (!p.owner.isActive) continue;
    if (!plansByUser.has(p.ownerId)) {
      plansByUser.set(p.ownerId, p);
    }
  }

  const userIds = Array.from(plansByUser.keys());
  const subjectsByUser = new Map<number, Array<{ name: string; examDate: string | null }>>();
  const allSubjects = await prisma.studySubject.findMany({
    where: { ownerId: { in: userIds }, examDate: { not: null } },
    select: { ownerId: true, name: true, examDate: true },
  });
  for (const s of allSubjects) {
    const list = subjectsByUser.get(s.ownerId) ?? [];
    list.push({ name: s.name, examDate: s.examDate });
    subjectsByUser.set(s.ownerId, list);
  }

  // Check which users already received a revision reminder notification today
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const existingNotifs = await prisma.notification.findMany({
    where: {
      recipientId: { in: userIds },
      type: NotificationType.SYSTEM,
      createdAt: { gte: startOfDay },
    },
    select: { recipientId: true, data: true },
  });

  const alreadyNotified = new Set<number>();
  for (const n of existingNotifs) {
    const d = (n.data ?? {}) as Record<string, unknown>;
    if (d.kind === "sphera_revision_reminder" && d.reminder_date === todayStr) {
      alreadyNotified.add(n.recipientId);
    }
  }

  let sentCount = 0;

  for (const [userId, plan] of plansByUser.entries()) {
    if (alreadyNotified.has(userId)) continue;

    const todayTasks = plan.tasks.map((t) => ({
      subjectName: t.subject?.name || "Cours",
      label: t.label,
      estimatedMinutes: t.estimatedMinutes,
    }));

    const upcomingExams = (subjectsByUser.get(userId) ?? [])
      .filter((s) => s.examDate)
      .map((s) => ({
        name: s.name,
        daysUntilExam: daysBetweenIso(todayStr, s.examDate!),
      }))
      .filter((e) => e.daysUntilExam >= 0 && e.daysUntilExam <= 3)
      .sort((a, b) => a.daysUntilExam - b.daysUntilExam);

    const payload = buildRevisionReminderPayload({ todayTasks, upcomingExams });
    if (!payload) continue;

    await createNotification({
      type: NotificationType.SYSTEM,
      title: payload.title,
      message: payload.message,
      recipientId: userId,
      data: {
        kind: "sphera_revision_reminder",
        reminder_date: todayStr,
        plan_id: String(plan.id),
        url: "/plan",
      },
    });

    const allowEmail = plan.owner.notificationSetting?.systemUpdates ?? true;
    if (allowEmail && plan.owner.email) {
      void sendRevisionReminderEmail({
        to: plan.owner.email,
        firstName: plan.owner.firstName || plan.owner.username,
        subjectLine: payload.emailSubject,
        heading: payload.emailHeading,
        intro: payload.emailIntro,
        tasks: todayTasks,
        upcomingExams,
      }).catch((err: unknown) => {
        console.warn(`[planner-reminders] email failed for user ${userId}:`, err);
      });
    }

    sentCount++;
  }

  if (sentCount > 0) {
    console.log(`[jobs] sent ${sentCount} Sphera revision reminder(s) for ${todayStr}`);
  }
  return sentCount;
}
