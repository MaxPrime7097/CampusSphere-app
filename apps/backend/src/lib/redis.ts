/**
 * Redis connections.
 *
 * Redis is the substrate for everything that must be shared *between* instances:
 * realtime fan-out, rate-limit counters, and scheduled-job leadership. Anything
 * held in a process-local `Map` silently breaks the moment the service runs more
 * than one instance, which is exactly the failure mode this module exists to
 * remove.
 *
 * Three roles, three connections, because a connection in subscriber mode cannot
 * issue ordinary commands:
 *
 *   commands    rate-limit counters, job locks
 *   publisher   realtime fan-out, outbound
 *   subscriber  realtime fan-out, inbound
 *
 * `REDIS_URL` is optional in development (each subsystem falls back to a
 * process-local implementation and logs once) and mandatory in production —
 * see assertProductionConfig(). Degrading silently in production would reintroduce
 * the cross-instance bug rather than surface it.
 */

import { Redis, type RedisOptions } from "ioredis";
import { env } from "../config/env.js";

const REDIS_PREFIX = "cs:";

/**
 * Namespace a key or pub/sub channel.
 *
 * Applied explicitly rather than through ioredis's `keyPrefix` option, because
 * that option prefixes *keys* but not pub/sub channel names, and its handling of
 * EVAL's KEYS array is an implementation detail. Doing it here means one rule,
 * visible at every call site.
 */
export const redisKey = (...parts: Array<string | number>): string => REDIS_PREFIX + parts.join(":");

/** True when a Redis URL is configured. Subsystems branch on this at startup. */
export const redisEnabled = Boolean(env.redisUrl);

/**
 * Shared options.
 *
 * `commandTimeout` matters: without it a command issued while Redis is
 * unreachable sits in the offline queue until the TCP layer gives up, and every
 * rate-limited request would hang with it. One second, then the caller decides
 * how to degrade.
 */
const baseOptions: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  commandTimeout: 3_000,
  // Exponential-ish backoff capped at 3s, so a long outage does not become a
  // reconnect storm when Redis comes back.
  retryStrategy: (attempt) => Math.min(attempt * 200, 3_000),
};

const connections: Redis[] = [];

function create(role: string, overrides: RedisOptions = {}): Redis {
  const client = new Redis(env.redisUrl as string, { ...baseOptions, ...overrides });

  // ioredis is an EventEmitter: an unhandled "error" event would throw and take
  // the process down. Redis being briefly unreachable must not do that.
  client.on("error", (error: Error) => {
    console.error(`[redis:${role}] ${error.message}`);
  });
  client.on("end", () => console.warn(`[redis:${role}] connection closed`));

  void client.connect().catch((error: Error) => {
    console.error(`[redis:${role}] initial connect failed: ${error.message}`);
  });

  connections.push(client);
  return client;
}

let commandClient: Redis | null = null;
let publisherClient: Redis | null = null;
let subscriberClient: Redis | null = null;

/** Command connection — counters and locks. Null when Redis is not configured. */
export function redisCommands(): Redis | null {
  if (!redisEnabled) return null;
  commandClient ??= create("commands");
  return commandClient;
}

/** Publish connection. Null when Redis is not configured. */
export function redisPublisher(): Redis | null {
  if (!redisEnabled) return null;
  publisherClient ??= create("publisher");
  return publisherClient;
}

/**
 * Subscribe connection. Null when Redis is not configured.
 *
 * `enableOfflineQueue` stays on here: a SUBSCRIBE issued during a reconnect must
 * be replayed, otherwise the instance would come back connected but deaf.
 * `maxRetriesPerRequest: null` for the same reason — a subscriber should retry
 * indefinitely rather than give up on the channel.
 */
export function redisSubscriber(): Redis | null {
  if (!redisEnabled) return null;
  subscriberClient ??= create("subscriber", { maxRetriesPerRequest: null, commandTimeout: undefined });
  return subscriberClient;
}

/** Close every open connection. Called from the shutdown path. */
export async function closeRedis(): Promise<void> {
  await Promise.allSettled(connections.map((client) => client.quit()));
  connections.length = 0;
  commandClient = null;
  publisherClient = null;
  subscriberClient = null;
}

/**
 * Circuit breaker shared by every Redis-backed subsystem that can degrade.
 *
 * Without this, a Redis outage costs `commandTimeout` on *every* request. After a
 * failure the breaker opens for 30 seconds and callers skip Redis entirely, so an
 * outage degrades throughput rather than latency.
 */
const BREAKER_OPEN_MS = 30_000;
let breakerOpenUntil = 0;

export function redisAvailable(): boolean {
  return redisEnabled && Date.now() >= breakerOpenUntil;
}

export function reportRedisFailure(context: string, error: unknown): void {
  if (Date.now() >= breakerOpenUntil) {
    console.error(`[redis] ${context} failed, degrading for ${BREAKER_OPEN_MS / 1000}s:`, error);
  }
  breakerOpenUntil = Date.now() + BREAKER_OPEN_MS;
}
