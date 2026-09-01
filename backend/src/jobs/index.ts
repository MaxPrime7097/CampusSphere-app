/**
 * Scheduled background work — API_CONTRACT §4.
 *
 * Django ran these on a separate Celery beat process. They run in-process here,
 * guarded by claimPeriod() so exactly one instance executes each occurrence. That
 * removes a whole deployment component (a worker service, a beat service, and the
 * broker they shared) in exchange for one Redis key per job per period.
 *
 * Jobs must be short and idempotent. Anything long-running belongs in a real queue,
 * not on a setInterval.
 */

import { prisma } from "../lib/prisma.js";
import { claimPeriod } from "./lock.js";
import { sendEventReminders } from "../services/eventNotifications.js";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Delete spheres past their expiry that asked to be auto-deleted.
 *
 * Ported from Celery's `cleanup_expired_spheres_task`. Cascades handle members,
 * posts, files and tasks — the foreign keys are declared `onDelete: Cascade`.
 */
export async function cleanupExpiredSpheres(): Promise<number> {
  const { count } = await prisma.sphere.deleteMany({
    where: {
      autoDeleteOnExpiry: true,
      expiresAt: { not: null, lte: new Date() },
    },
  });
  if (count > 0) console.log(`[jobs] auto-deleted ${count} expired spheres`);
  return count;
}

/**
 * Drop revoked-token rows whose underlying token has expired anyway.
 *
 * A revocation only has to outlive the token it revokes. Without this the table
 * grows forever — one row per logout, kept for the life of the database.
 */
export async function pruneRevokedTokens(): Promise<number> {
  const { count } = await prisma.revokedToken.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  if (count > 0) console.log(`[jobs] pruned ${count} expired token revocations`);
  return count;
}

interface ScheduledJob {
  name: string;
  periodSeconds: number;
  run: () => Promise<unknown>;
}

const JOBS: ScheduledJob[] = [
  { name: "cleanup-expired-spheres", periodSeconds: 3600, run: cleanupExpiredSpheres },
  { name: "prune-revoked-tokens", periodSeconds: 86_400, run: pruneRevokedTokens },
  { name: "send-event-reminders", periodSeconds: 3600, run: sendEventReminders },
];

const timers: NodeJS.Timeout[] = [];

async function runIfLeader(job: ScheduledJob): Promise<void> {
  try {
    if (!(await claimPeriod(job.name, job.periodSeconds))) return;
    await job.run();
  } catch (error) {
    // A failing job must never take the process down; the next period retries.
    console.error(`[jobs] ${job.name} failed:`, error);
  }
}

/**
 * Start the schedulers.
 *
 * Each job is checked hourly regardless of its period; `claimPeriod` decides
 * whether this occurrence is due. That keeps a job whose period exceeds an hour
 * from being skipped entirely when an instance is replaced mid-period, which is
 * routine on Render.
 *
 * The first check is delayed rather than run at boot: a deploy restarts every
 * instance at once, and staggering avoids all of them contending for the same key
 * while they are still opening database connections.
 */
export function startJobs(): void {
  const START_DELAY_MS = 30_000;

  for (const job of JOBS) {
    const timer = setTimeout(() => {
      void runIfLeader(job);
      const interval = setInterval(() => void runIfLeader(job), HOUR_MS);
      interval.unref();
      timers.push(interval);
    }, START_DELAY_MS);
    timer.unref();
    timers.push(timer);
  }

  console.log(`[jobs] ${JOBS.length} scheduled jobs armed`);
}

export function stopJobs(): void {
  for (const timer of timers) clearTimeout(timer);
  timers.length = 0;
}
