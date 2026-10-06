/**
 * Aggregate counts shown on a profile — API_CONTRACT §2 `<User>`.
 *
 * `connections_count` counts ACCEPTED connections in either direction; pending
 * requests are excluded. `contributions_count` is posts + resources.
 */

import { prisma } from "./prisma.js";
import type { UserCounts } from "../serializers/user.js";

export async function loadUserCounts(userId: number): Promise<UserCounts> {
  const [joinedSpheres, connections, posts, resources] = await Promise.all([
    prisma.sphereMember.count({ where: { userId, status: "ACTIVE" } }),
    prisma.connection.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { recipientId: userId }] },
    }),
    prisma.post.count({ where: { authorId: userId } }),
    prisma.resource.count({ where: { authorId: userId, audience: { not: "sphera_internal" } } }),
  ]);

  return { joinedSpheres, connections, contributions: posts + resources };
}
