/**
 * Presence and Online Status Tracking.
 *
 * Tracks live socket connections per user across instances via Redis (with local fallback).
 */

import type { WebSocket } from "ws";
import { redisCommands, redisKey, redisAvailable } from "../lib/redis.js";

const userSockets = new Map<number, Set<WebSocket>>();

/** Returns true if the user has at least one active socket on this instance. */
export function isUserOnlineLocally(userId: number): boolean {
  const sockets = userSockets.get(userId);
  return Boolean(sockets && sockets.size > 0);
}

/** Returns true if the user is online across any instance. */
export async function isUserOnline(userId: number): Promise<boolean> {
  if (isUserOnlineLocally(userId)) return true;
  if (redisAvailable()) {
    const redis = redisCommands();
    if (redis) {
      try {
        const res = await redis.sismember(redisKey("presence:online"), String(userId));
        return res === 1;
      } catch {
        return false;
      }
    }
  }
  return false;
}

/** Record a new socket connection for a user. Returns true if the user just became online. */
export function recordConnect(userId: number, socket: WebSocket): boolean {
  let sockets = userSockets.get(userId);
  const wasOnline = Boolean(sockets && sockets.size > 0);
  if (!sockets) {
    sockets = new Set();
    userSockets.set(userId, sockets);
  }
  sockets.add(socket);

  if (!wasOnline) {
    if (redisAvailable()) {
      const redis = redisCommands();
      if (redis) {
        redis.sadd(redisKey("presence:online"), String(userId)).catch(() => undefined);
      }
    }
    return true;
  }
  return false;
}

/** Record socket disconnection for a user. Returns true if the user just went completely offline. */
export function recordDisconnect(userId: number, socket: WebSocket): boolean {
  const sockets = userSockets.get(userId);
  if (!sockets) return false;
  sockets.delete(socket);
  if (sockets.size === 0) {
    userSockets.delete(userId);
    if (redisAvailable()) {
      const redis = redisCommands();
      if (redis) {
        redis.srem(redisKey("presence:online"), String(userId)).catch(() => undefined);
      }
    }
    return true;
  }
  return false;
}

/** Returns all user IDs currently connected to this instance. */
export function getLocalOnlineUserIds(): number[] {
  return Array.from(userSockets.keys());
}

/** Given a list of user IDs, returns those that are currently online. */
export async function getOnlineUserIds(userIds: number[]): Promise<number[]> {
  if (userIds.length === 0) return [];
  const online: number[] = [];
  for (const id of userIds) {
    if (await isUserOnline(id)) {
      online.push(id);
    }
  }
  return online;
}
