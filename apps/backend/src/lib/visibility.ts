/**
 * Visibility predicates — who may read what.
 *
 * These live in one module rather than one per router because search has to apply
 * *exactly* the same rules as the feed. A second, hand-written copy of "which posts
 * can this user see" inside the search endpoint is how a search box ends up
 * surfacing private content: the two implementations drift, and only one of them
 * gets updated when a visibility level is added.
 *
 * API_CONTRACT §3.11: "Search must not leak: private spheres appear only to
 * members, posts and resources only within the caller's visibility scope."
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Ids of users the caller has an ACCEPTED connection with. */
export async function friendIds(userId: number): Promise<number[]> {
  const rows = await prisma.connection.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { recipientId: userId }] },
    select: { requesterId: true, recipientId: true },
  });
  return rows.map((r) => (r.requesterId === userId ? r.recipientId : r.requesterId));
}

/** Sphere ids the caller is an active member of. */
export async function memberSphereIds(userId: number): Promise<number[]> {
  const rows = await prisma.sphereMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: { sphereId: true },
  });
  return rows.map((r) => r.sphereId);
}

/**
 * Every post the caller may read.
 * A null viewer is anonymous and sees public posts only.
 */
export async function postsVisibleTo(userId: number | null): Promise<Prisma.PostWhereInput> {
  if (userId === null) return { visibility: "PUBLIC" };

  const [friends, spheres] = await Promise.all([friendIds(userId), memberSphereIds(userId)]);
  return {
    OR: [
      { visibility: "PUBLIC" },
      { authorId: userId },
      { visibility: "SPHERE", sphereId: { in: spheres } },
      { visibility: "FRIENDS", authorId: { in: friends } },
    ],
  };
}

/**
 * Every resource the caller may read.
 * A null viewer is anonymous and sees public resources only.
 */
export async function resourcesVisibleTo(userId: number | null): Promise<Prisma.ResourceWhereInput> {
  const notSpheraInternal: Prisma.ResourceWhereInput = {
    audience: { not: "sphera_internal" },
  };

  if (userId === null) {
    return {
      AND: [
        notSpheraInternal,
        { visibility: "PUBLIC" },
      ],
    };
  }

  const [me, friends] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { university: true } }),
    friendIds(userId),
  ]);

  return {
    AND: [
      notSpheraInternal,
      {
        OR: [
          { visibility: "PUBLIC" },
          { authorId: userId },
          ...(me?.university ? [{ visibility: "UNIVERSITY" as const, author: { university: me.university } }] : []),
          { visibility: "FRIENDS", authorId: { in: friends } },
        ],
      },
    ],
  };
}

/**
 * Every sphere the caller may see listed.
 *
 * Public spheres, plus private ones they are an active member of or created. A
 * private sphere must not appear in search results for a non-member — its name and
 * description are the private part.
 */
export async function spheresVisibleTo(userId: number | null): Promise<Prisma.SphereWhereInput> {
  if (userId === null) return { isPrivate: false };

  const spheres = await memberSphereIds(userId);
  return {
    OR: [{ isPrivate: false }, { id: { in: spheres } }, { createdById: userId }],
  };
}
