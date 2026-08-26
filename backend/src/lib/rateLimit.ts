/**
 * Fixed-window rate limiting — API_CONTRACT §5.
 *
 * Counters live in Redis so the limit is the limit regardless of how many
 * instances are running. A process-local counter would multiply every published
 * limit by the instance count, which is the same as having no limit at all once
 * the service is scaled out.
 *
 * Falls back to an in-process window when Redis is absent (development) or
 * unreachable (the circuit breaker in lib/redis.ts is open). The fallback is
 * deliberately *fail-open* for availability: a Redis outage must not lock every
 * user out of the product. It still applies the per-instance window, so an outage
 * loosens the limit rather than removing it.
 */

import { redisAvailable, redisCommands, redisKey, reportRedisFailure } from "./redis.js";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. Sent as Retry-After on a 429. */
  retryAfter: number;
}

/**
 * INCR plus a first-write EXPIRE, atomically.
 *
 * Doing it as two round trips leaves a window where a crash between them strands
 * a key with no TTL, which would throttle that bucket forever.
 */
const INCREMENT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return {current, redis.call('TTL', KEYS[1])}
`;

/** bucket -> {count, resetAt} for the no-Redis path. */
const localWindows = new Map<string, { count: number; resetAt: number }>();

function consumeLocal(bucket: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = localWindows.get(bucket);

  if (!existing || existing.resetAt <= now) {
    localWindows.set(bucket, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, limit, remaining: limit - 1, retryAfter: windowSeconds };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter,
  };
}

/**
 * Sweep expired local windows.
 *
 * Only reachable on the fallback path, but a long-lived process serving many
 * distinct IPs would otherwise grow this map without bound.
 */
const LOCAL_SWEEP_MS = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [bucket, window] of localWindows) {
    if (window.resetAt <= now) localWindows.delete(bucket);
  }
}, LOCAL_SWEEP_MS).unref();

/** Count one hit against a bucket. */
export async function consume(bucket: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const client = redisAvailable() ? redisCommands() : null;
  if (!client) return consumeLocal(bucket, limit, windowSeconds);

  try {
    const [count, ttl] = (await client.eval(
      INCREMENT_SCRIPT,
      1,
      redisKey("rl", bucket),
      String(windowSeconds),
    )) as [number, number];

    // TTL -1 means the key exists with no expiry, which the script should have
    // prevented; treat it as a full window rather than reporting a negative wait.
    const retryAfter = ttl > 0 ? ttl : windowSeconds;
    return { allowed: count <= limit, limit, remaining: Math.max(0, limit - count), retryAfter };
  } catch (error) {
    reportRedisFailure(`rate limit ${bucket}`, error);
    return consumeLocal(bucket, limit, windowSeconds);
  }
}

/** Drop a bucket — used to forgive the counter after a successful login. */
export async function reset(bucket: string): Promise<void> {
  localWindows.delete(bucket);
  const client = redisAvailable() ? redisCommands() : null;
  if (!client) return;
  try {
    await client.del(redisKey("rl", bucket));
  } catch (error) {
    reportRedisFailure(`rate limit reset ${bucket}`, error);
  }
}
