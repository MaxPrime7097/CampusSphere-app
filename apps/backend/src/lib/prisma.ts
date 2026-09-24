/**
 * Prisma client singleton.
 *
 * A single instance per process: Prisma manages its own connection pool, and
 * constructing more than one exhausts Postgres connections quickly. The dev
 * hot-reloader would otherwise leak a client per reload, so the instance is
 * stashed on globalThis outside production.
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

/**
 * Connection-level failures worth retrying.
 *
 * Serverless Postgres (Neon, Supabase) suspends compute when idle, so the first
 * query after an idle period can fail to connect even though the database is
 * perfectly healthy a second later. Without this, an unlucky request 500s and — in
 * the contract suite — looks exactly like a regression.
 *
 * Deliberately narrow: only connection establishment. Query errors, constraint
 * violations and timeouts are NOT retried, because replaying those either changes
 * behaviour or hides a real bug.
 *
 *   P1001 — can't reach database server
 *   P1002 — server reached but timed out
 *   P1017 — server closed the connection
 *   P2024 — timed out waiting for a connection from the pool
 *
 * P2024 is safe to retry for the same reason as the rest: the query never acquired
 * a connection, so it never executed and cannot have had a side effect. It shows up
 * under burst load when every pooled connection is busy on a slow remote database.
 */
const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

/**
 * Budget sized for a serverless cold start, not a network blip.
 *
 * A suspended Neon/Supabase instance takes seconds to wake, so a short budget just
 * burns its attempts while the database is still starting and surfaces the failure
 * anyway — which is exactly what happened at the original 4.5s: requests issued
 * against a suspended Neon compute exhausted all five attempts and 500'd while the
 * database was mid-resume. Six attempts spanning ~12.4s covers an observed resume
 * with real margin.
 *
 * The ceiling matters more than the count. Erring long is right here: the
 * alternative to waiting is returning an error for a database that is about to be
 * fine, and Render's health check would fail alongside it.
 */
const MAX_ATTEMPTS = 6;
const BASE_DELAY_MS = 400;

function isRetryable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_CODES.has(error.code)
  ) || error instanceof Prisma.PrismaClientInitializationError;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createClient() {
  const base = new PrismaClient({ log: env.debug ? ["warn", "error"] : ["error"] });

  return base.$extends({
    name: "retry-on-connection-error",
    query: {
      async $allOperations({ args, query, model, operation }) {
        let lastError: unknown;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            if (!isRetryable(error) || attempt === MAX_ATTEMPTS) throw error;
            lastError = error;

            // Exponential backoff: a suspended instance typically needs a moment
            // to wake, and hammering it immediately just burns the retry budget.
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            console.warn(
              `[prisma] connection error on ${model ?? "raw"}.${operation}, ` +
                `retrying in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS})`,
            );
            await sleep(delay);
          }
        }

        throw lastError;
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

export const prisma: ExtendedClient = globalForPrisma.prisma ?? createClient();

if (!env.isProduction) globalForPrisma.prisma = prisma;

/** Liveness probe for the health endpoint. Never throws. */
export async function databaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
