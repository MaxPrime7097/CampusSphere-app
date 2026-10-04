/**
 * HTTP & Redis Caching Service.
 *
 * Provides:
 * 1. Redis-backed fast-path cache for hot read queries (spheres, resources, events, posts).
 * 2. Instant 304 Not Modified validation directly from Redis without hitting the database.
 * 3. O(1) atomic versioned namespace invalidation on mutations.
 * 4. Resilient circuit breaker: if Redis is unavailable or unconfigured, requests fall through
 *    gracefully to PostgreSQL while preserving standard HTTP conditional ETag revalidation.
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { redisCommands, redisAvailable, redisKey, reportRedisFailure } from "./redis.js";

/** In-memory fallback version counters when Redis is unconfigured or offline */
const localVersions = new Map<string, number>();

/**
 * Get the current cache version for a namespace.
 * Atomic and shared across all instances via Redis.
 */
export async function getNamespaceVersion(namespace: string): Promise<number> {
  if (!redisAvailable()) {
    return localVersions.get(namespace) ?? 1;
  }
  const redis = redisCommands();
  if (!redis) return localVersions.get(namespace) ?? 1;

  try {
    const val = await redis.get(redisKey("ver", namespace));
    return val ? parseInt(val, 10) : 1;
  } catch (error) {
    reportRedisFailure(`getNamespaceVersion ${namespace}`, error);
    return localVersions.get(namespace) ?? 1;
  }
}

/**
 * Invalidate a cache namespace atomically.
 * Increments the version counter in Redis so all cluster instances instantly bypass stale cache entries.
 */
export async function invalidateCache(namespace: string): Promise<void> {
  localVersions.set(namespace, (localVersions.get(namespace) ?? 1) + 1);

  if (!redisAvailable()) return;
  const redis = redisCommands();
  if (!redis) return;

  try {
    await redis.incr(redisKey("ver", namespace));
  } catch (error) {
    reportRedisFailure(`invalidateCache ${namespace}`, error);
  }
}

/**
 * Middleware that automatically invalidates the given namespace(s) on successful mutating requests (POST, PUT, PATCH, DELETE).
 */
export function autoInvalidate(...namespaces: (string | string[])[]) {
  const flattened = namespaces.flat();
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.on("finish", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          for (const ns of flattened) {
            void invalidateCache(ns);
          }
        }
      });
    }
    next();
  };
}

interface HttpCacheOptions {
  namespace: string;
  ttlSeconds?: number;
  userScoped?: boolean;
}

/**
 * Express middleware for Redis + HTTP conditional caching.
 */
export function httpCache(options: HttpCacheOptions) {
  const ttl = options.ttlSeconds ?? 60;
  const userScoped = options.userScoped ?? true;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET or HEAD requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    // If Redis is not available, proceed normally (Express will still generate ETag and handle 304 if unchanged)
    if (!redisAvailable()) {
      return next();
    }

    const redis = redisCommands();
    if (!redis) {
      return next();
    }

    try {
      const version = await getNamespaceVersion(options.namespace);
      const userPart = userScoped ? `u:${req.user?.id ?? "anon"}` : "pub";
      const key = redisKey("cache", options.namespace, `v${version}`, userPart, req.originalUrl);

      const cached = await redis.get(key);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { etag: string; body: string; contentType?: string };

          // Check conditional ETag
          const ifNoneMatch = req.headers["if-none-match"];
          if (
            ifNoneMatch &&
            (ifNoneMatch === parsed.etag ||
              ifNoneMatch === `W/${parsed.etag}` ||
              `W/${ifNoneMatch}` === parsed.etag ||
              ifNoneMatch === "*")
          ) {
            res.setHeader("ETag", parsed.etag);
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("X-Cache", "HIT-304");
            res.status(304).end();
            return;
          }

          // Cache hit: serve cached payload without touching PostgreSQL
          res.setHeader("ETag", parsed.etag);
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("X-Cache", "HIT");
          res.setHeader("Content-Type", parsed.contentType || "application/json; charset=utf-8");
          res.status(200).send(parsed.body);
          return;
        } catch {
          // Bad JSON in cache, continue to fresh fetch
        }
      }

      // Intercept res.send to capture body and store in Redis on 200 OK
      const originalSend = res.send.bind(res);
      res.send = function (bodyContent: unknown): Response {
        res.send = originalSend;

        if (res.statusCode === 200) {
          let strBody: string | null = null;
          if (typeof bodyContent === "string") {
            strBody = bodyContent;
          } else if (Buffer.isBuffer(bodyContent)) {
            strBody = bodyContent.toString("utf8");
          }

          if (strBody !== null) {
            let etag = res.getHeader("ETag") as string | undefined;
            if (!etag) {
              const hash = crypto.createHash("sha1").update(strBody).digest("hex").slice(0, 16);
              etag = `W/"${strBody.length.toString(16)}-${hash}"`;
              res.setHeader("ETag", etag);
            }

            const payloadToCache = JSON.stringify({
              etag,
              body: strBody,
              contentType: res.getHeader("Content-Type") || "application/json; charset=utf-8",
            });

            redis
              .set(key, payloadToCache, "EX", ttl)
              .catch((err) => reportRedisFailure(`set cache ${key}`, err));
          }
        }

        return originalSend(bodyContent);
      };

      next();
    } catch (err) {
      reportRedisFailure(`httpCache ${options.namespace}`, err);
      next();
    }
  };
}
