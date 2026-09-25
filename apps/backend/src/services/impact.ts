/**
 * Impact scoring — the single authority for point values.
 *
 * documentation/IMPACT_POLICY.md and the Django implementation disagreed: the
 * policy states that scoring on post creation was deliberately removed so the score
 * rewards usefulness rather than volume, but `posts/views.py` still awarded +1 via
 * POST_CREATED. **The document wins.**
 *
 * Active rules:
 *   resource upload   +5
 *   post rating       +1..+5 to the post's author (the rating value)
 *   post creation      0   [CHANGE] was +1
 *   comment creation   0
 *   resource download  0
 */

import { prisma } from "../lib/prisma.js";

/**
 * Either the client or a transaction client.
 *
 * Expressed as an Omit of the real client rather than `Prisma.TransactionClient`,
 * because the client is extended (retry-on-connection-error) and its transaction
 * callback yields the extended type, which is not assignable to the base one.
 */
type Client = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export const IMPACT_POINTS = {
  POST_CREATED: 0,
  COMMENT_CREATED: 0,
  RESOURCE_UPLOADED: 5,
  RESOURCE_DOWNLOADED: 0,
} as const;

export type ImpactEvent = keyof typeof IMPACT_POINTS;

/** Apply a fixed-value event. No-ops when the event is worth zero. */
export async function applyImpactEvent(userId: number, event: ImpactEvent, client: Client = prisma): Promise<number> {
  const points = IMPACT_POINTS[event];
  if (points === 0) return 0;
  await client.user.update({ where: { id: userId }, data: { impactScore: { increment: points } } });
  return points;
}

/**
 * Apply an explicit delta, which may be negative — re-rating a post from 5 to 2
 * must subtract 3 rather than stacking, and removing a rating must subtract it.
 */
export async function applyImpactDelta(userId: number, delta: number, client: Client = prisma): Promise<number> {
  if (delta === 0) return 0;
  await client.user.update({ where: { id: userId }, data: { impactScore: { increment: delta } } });
  return delta;
}

/**
 * Recompute a post's impact_score by aggregating its ratings.
 *
 * Two round trips, so it is NOT for the hot path — see `adjustPostImpact`. Kept for
 * repair and backfill, where correctness from first principles matters more than
 * latency.
 */
export async function recomputePostImpact(postId: number, client: Client = prisma): Promise<number> {
  const aggregate = await client.postImpactRating.aggregate({ where: { postId }, _sum: { value: true } });
  const total = aggregate._sum.value ?? 0;
  await client.post.update({ where: { id: postId }, data: { impactScore: total } });
  return total;
}

/**
 * Shift a post's impact_score by a delta.
 *
 * `impactScore` is defined as the sum of its ratings, so when one user's rating
 * moves by `delta` the sum moves by exactly `delta` — no aggregate needed. This
 * replaced a read-then-write in the rating path that pushed the enclosing
 * transaction past Prisma's 5s interactive-transaction timeout on a remote
 * database, failing the write intermittently (P2028).
 */
export async function adjustPostImpact(postId: number, delta: number, client: Client = prisma): Promise<void> {
  if (delta === 0) return;
  await client.post.update({ where: { id: postId }, data: { impactScore: { increment: delta } } });
}
