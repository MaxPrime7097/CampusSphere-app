/**
 * Process entrypoint.
 *
 * Migrations are applied by docker-entrypoint.sh before this runs, so the schema
 * is already current by the time the listener binds.
 */

import { createApp } from "./app.js";
import { assertProductionConfig, env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { closeRedis, redisEnabled } from "./lib/redis.js";
import { startJobs, stopJobs } from "./jobs/index.js";
import { attachWebSockets } from "./realtime/websocket.js";

assertProductionConfig();

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`[server] CampusSphere API listening on :${env.port} (${env.isProduction ? "production" : "development"})`);
  if (!redisEnabled) {
    // Loud, and repeated on every boot: this is correct on one instance and silently
    // broken on two, and nothing in the running system can tell the difference.
    console.warn(
      "[server] REDIS_URL unset: realtime fan-out, rate limits and jobs are process-local.\n" +
        "[server] This is correct for ONE instance only. Adding a second instance without Redis\n" +
        "[server] will deliver chat events to only some clients, multiply every rate limit by the\n" +
        "[server] instance count, and run every scheduled job once per instance.",
    );
    if (env.isProduction && env.singleInstance) {
      console.warn("[server] running with SINGLE_INSTANCE=true — remove it and set REDIS_URL before scaling out");
    }
  } else if (env.singleInstance) {
    console.warn("[server] SINGLE_INSTANCE is set but REDIS_URL is configured — the flag is redundant and can be removed");
  }
});

// Realtime chat shares the HTTP listener, so Render needs no extra port or service.
attachWebSockets(server);

// Replaces Celery beat. One instance runs each occurrence; see jobs/lock.ts.
startJobs();

/**
 * Render sends SIGTERM on deploy and waits before SIGKILL. Draining in-flight
 * requests and closing the pool avoids dropped responses and leaked connections
 * mid-deploy.
 */
function shutdown(signal: string): void {
  console.log(`[server] ${signal} received, draining`);
  stopJobs();
  server.close(() => {
    void Promise.allSettled([prisma.$disconnect(), closeRedis()]).finally(() => {
      console.log("[server] shutdown complete");
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("[server] drain timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
