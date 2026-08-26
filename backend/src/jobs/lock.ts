/**
 * Once-per-period leadership for scheduled work.
 *
 * Every instance runs the same timers, so without coordination an hourly job runs
 * once per instance per hour. For the sphere cleanup that means N concurrent
 * deletes racing each other; for anything that sends mail it means N copies.
 *
 * The primitive is `SET <key> <instance> NX EX <period>`: whichever instance sets
 * the key first runs the job, everyone else backs off until the key expires. The
 * key is deliberately *not* released when the job finishes — it is a
 * "already ran this period" marker, not a mutex. Releasing it would let a second
 * instance whose timer fires a few minutes later acquire it and run the job again
 * within the same period.
 *
 * Without Redis this returns true (single process, nothing to coordinate).
 */

import { redisAvailable, redisCommands, redisKey } from "../lib/redis.js";
import { randomUUID } from "node:crypto";

const INSTANCE_ID = randomUUID();

export async function claimPeriod(job: string, periodSeconds: number): Promise<boolean> {
  const client = redisAvailable() ? redisCommands() : null;
  if (!client) return true;

  try {
    const result = await client.set(redisKey("job", job), INSTANCE_ID, "EX", periodSeconds, "NX");
    return result === "OK";
  } catch (error) {
    // A Redis failure must not stop scheduled work altogether. Running twice is a
    // worse outcome than not running for most jobs, so this errs the other way
    // and skips — the next period retries.
    console.error(`[jobs] leadership check failed for ${job}, skipping this period:`, error);
    return false;
  }
}
