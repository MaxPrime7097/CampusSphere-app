import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { getWeekStartDate } from "../lib/weekHelper.js";
import { currentUser } from "./auth.js";

export const WEEKLY_LIMIT = 5;

/**
 * Middleware enforcing the weekly generation limit (5 generations per week per student).
 * Checks the quota before generation runs.
 */
export async function checkGenerationQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = currentUser(req);
  if (!user || !user.id) {
    res.status(401).json({
      success: false,
      error: "authentication_required",
      message: "Tu dois être connecté pour générer du contenu sur Sphera.",
    });
    return;
  }

  const weekStart = getWeekStartDate();

  try {
    let usage = await prisma.generationUsage.findUnique({
      where: {
        userId_weekStartDate: {
          userId: user.id,
          weekStartDate: weekStart,
        },
      },
    });

    if (!usage) {
      try {
        usage = await prisma.generationUsage.create({
          data: {
            userId: user.id,
            weekStartDate: weekStart,
            count: 0,
          },
        });
      } catch {
        // If concurrent request created it first, fetch again
        usage = await prisma.generationUsage.findUnique({
          where: {
            userId_weekStartDate: {
              userId: user.id,
              weekStartDate: weekStart,
            },
          },
        });
      }
    }

    const currentCount = usage?.count ?? 0;
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
  } catch (error) {
    console.warn("[sphera-quota] Warning: checkGenerationQuota DB check failed, allowing generation:", error);
  }

  next();

}

/**
 * Increment user's weekly generation count after successful generation.
 */
export async function incrementGenerationQuota(userId: number, amount = 1): Promise<void> {
  if (!userId || amount <= 0) return;
  const weekStart = getWeekStartDate();

  try {
    await prisma.generationUsage.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: weekStart,
        },
      },
      update: {
        count: { increment: amount },
      },
      create: {
        userId,
        weekStartDate: weekStart,
        count: amount,
      },
    });
  } catch (error) {
    console.error("[sphera-quota] Failed to increment generation quota:", error);
  }
}
