/**
 * Search and filter options — mounted at /api/. API_CONTRACT §3.11.
 *
 * Search reuses the visibility predicates from lib/visibility.ts rather than
 * building its own `WHERE`. That is the whole safety argument for this file: a
 * private sphere, a friends-only post and a university-scoped resource are
 * excluded because the search query is literally `AND`-ed with the same predicate
 * the feed uses.
 *
 * @status ACTIVE   GET /api/search/
 * @status UNUSED   GET /api/search/suggestions/  GET /api/filters/
 */

import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/envelope.js";
import { badRequest } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { postsVisibleTo, resourcesVisibleTo, spheresVisibleTo } from "../lib/visibility.js";
import { serializeUserSummary, userSelect } from "../serializers/user.js";
import { normalizeFileEntry } from "../serializers/post.js";

export const searchRouter: Router = Router();

/**
 * `requireAuth` is attached per route rather than with `searchRouter.use(...)`:
 * this router is mounted at the API root, and router-level middleware there would
 * run for every request in the application — 401'ing public routes owned by other
 * routers before they were reached.
 */

const ENTITY_TYPES = ["all", "users", "spheres", "posts", "resources"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

/** Cap the fan-out: an unbounded `limit` is a cheap way to dump the database. */
const MAX_LIMIT = 50;

function parseLimit(raw: unknown, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(value)));
}

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

/**
 * Ids of rows whose `tags` JSON array contains the query as a substring.
 *
 * `tags` is a JSON column, so Prisma's `has` (a scalar-list operator) does not
 * apply and `array_contains` would only match a whole tag exactly — searching
 * "math" would miss the tag "mathematics". Django cast the column to text and ran
 * `icontains`; the same cast is done here, in a parameterised query, and the ids
 * are folded back into the main `OR`.
 */
async function idsMatchingTags(table: "posts" | "resources", q: string): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>(
    table === "posts"
      ? Prisma.sql`SELECT id FROM posts WHERE tags::text ILIKE ${`%${q}%`} LIMIT 200`
      : Prisma.sql`SELECT id FROM resources WHERE tags::text ILIKE ${`%${q}%`} LIMIT 200`,
  );
  return rows.map((row) => row.id);
}

// ── Per-entity searches ─────────────────────────────────────────────────────

async function searchUsers(q: string, limit: number) {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { firstName: contains(q) },
        { lastName: contains(q) },
        { username: contains(q) },
        { bio: contains(q) },
      ],
      // Django also matched on `email`. Dropped: it turns the search box into an
      // address-confirmation oracle — type an address, learn whether it has an
      // account here. Nobody searches for a classmate by email address.
    },
    select: userSelect,
    orderBy: { impactScore: "desc" },
    take: limit,
  });
  return users.map((u) => serializeUserSummary(u));
}

async function searchSpheres(q: string, limit: number, viewerId: number) {
  const spheres = await prisma.sphere.findMany({
    where: {
      AND: [
        await spheresVisibleTo(viewerId),
        {
          OR: [
            { name: contains(q) },
            { description: contains(q) },
            { objective: contains(q) },
            { targetAudience: contains(q) },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      sphereType: true,
      color: true,
      icon: true,
      bannerImage: true,
      isPrivate: true,
      memberCount: true,
      impactScore: true,
      createdAt: true,
    },
    orderBy: { memberCount: "desc" },
    take: limit,
  });

  return spheres.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category.toLowerCase(),
    sphere_type: s.sphereType.toLowerCase(),
    color: s.color,
    icon: s.icon,
    banner_image: s.bannerImage,
    is_private: s.isPrivate,
    member_count: s.memberCount,
    impact_score: s.impactScore,
    created_at: s.createdAt.toISOString(),
  }));
}

async function searchPosts(q: string, limit: number, viewerId: number) {
  const [scope, taggedIds] = await Promise.all([postsVisibleTo(viewerId), idsMatchingTags("posts", q)]);

  const posts = await prisma.post.findMany({
    where: {
      AND: [
        scope,
        { OR: [{ content: contains(q) }, { subject: contains(q) }, { id: { in: taggedIds } }] },
      ],
    },
    include: { author: { select: userSelect } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    author: p.authorId,
    author_info: serializeUserSummary(p.author),
    sphere: p.sphereId,
    category: p.category.toLowerCase(),
    type: p.type.toLowerCase(),
    visibility: p.visibility.toLowerCase(),
    subject: p.subject,
    tags: p.tags,
    files: Array.isArray(p.files) ? (p.files as any[]).map(normalizeFileEntry) : [],
    impact_score: p.impactScore,
    created_at: p.createdAt.toISOString(),
  }));
}

async function searchResources(q: string, limit: number, viewerId: number) {
  const [scope, taggedIds] = await Promise.all([resourcesVisibleTo(viewerId), idsMatchingTags("resources", q)]);

  const resources = await prisma.resource.findMany({
    where: {
      AND: [
        scope,
        {
          OR: [
            { title: contains(q) },
            { description: contains(q) },
            { subject: contains(q) },
            { id: { in: taggedIds } },
          ],
        },
      ],
    },
    include: { author: { select: userSelect } },
    orderBy: { impactScore: "desc" },
    take: limit,
  });

  return resources.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    author: r.authorId,
    author_info: serializeUserSummary(r.author),
    file: r.fileUrl,
    file_type: r.fileType,
    file_size: r.fileSize,
    subject: r.subject,
    type: r.type.toLowerCase(),
    visibility: r.visibility.toLowerCase(),
    tags: r.tags,
    impact_score: r.impactScore,
    created_at: r.createdAt.toISOString(),
  }));
}

/**
 * Run one entity search, converting a failure into an empty result plus an entry
 * in `errors`.
 *
 * Ported from Django's per-entity try/except: one broken entity should degrade
 * that section of the results page, not blank the whole search.
 */
async function safely<T>(
  entity: string,
  run: () => Promise<T[]>,
  errors: Record<string, string>,
): Promise<T[]> {
  try {
    return await run();
  } catch (error) {
    console.error(`[search] ${entity} search failed:`, error);
    errors[entity] = `Failed to search ${entity}`;
    return [];
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────

searchRouter.get("/search/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const q = String(req.query.q ?? "").trim();
  const entityType = String(req.query.type ?? "all") as EntityType;
  const limit = parseLimit(req.query.limit, 10);

  if (!q) throw badRequest("Search query is required");
  if (!ENTITY_TYPES.includes(entityType)) {
    throw badRequest("Invalid entity type", { type: [`Must be one of: ${ENTITY_TYPES.join(", ")}`] });
  }

  const errors: Record<string, string> = {};
  const wanted = entityType === "all" ? (["users", "spheres", "posts", "resources"] as const) : ([entityType] as const);

  // Always every key, even for a narrowed search — the client indexes into
  // `data.posts` unconditionally and would otherwise read undefined.
  const results: Record<string, unknown[]> = { users: [], spheres: [], posts: [], resources: [] };

  await Promise.all(
    wanted.map(async (entity) => {
      if (entity === "users") results.users = await safely("users", () => searchUsers(q, limit), errors);
      if (entity === "spheres") results.spheres = await safely("spheres", () => searchSpheres(q, limit, me.id), errors);
      if (entity === "posts") results.posts = await safely("posts", () => searchPosts(q, limit, me.id), errors);
      if (entity === "resources") {
        results.resources = await safely("resources", () => searchResources(q, limit, me.id), errors);
      }
    }),
  );

  res.status(200).json({
    success: true,
    data: results,
    errors,
    query: q,
  });
});

/**
 * @status UNUSED — typeahead. `SearchDropdown` calls globalSearch instead.
 *
 * Under two characters returns an empty list rather than an error: a typeahead
 * fires on every keystroke, and the first one is never a real query.
 */
searchRouter.get("/search/suggestions/", requireAuth, async (req, res) => {
  const me = currentUser(req);
  const q = String(req.query.q ?? "").trim();
  const limit = parseLimit(req.query.limit, 5);

  if (q.length < 2) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const errors: Record<string, string> = {};
  const [users, spheres, posts, resources] = await Promise.all([
    safely("users", () => searchUsers(q, limit), errors),
    safely("spheres", () => searchSpheres(q, limit, me.id), errors),
    safely("posts", () => searchPosts(q, limit, me.id), errors),
    safely("resources", () => searchResources(q, limit, me.id), errors),
  ]);

  const suggestions = [
    ...users.map((u) => {
      const user = u as { id: number; first_name?: string; last_name?: string; username: string };
      return {
        type: "user",
        id: user.id,
        text: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username,
        subtitle: user.username,
        url: `/profile/${user.id}`,
      };
    }),
    ...spheres.map((s) => {
      const sphere = s as { id: number; name: string; member_count: number };
      return {
        type: "sphere",
        id: sphere.id,
        text: sphere.name,
        subtitle: `${sphere.member_count} membres`,
        url: `/spheres/${sphere.id}`,
      };
    }),
    ...posts.map((post) => ({
      type: "post",
      id: post.id,
      text: post.content.length > 100 ? `${post.content.slice(0, 100)}...` : post.content,
      subtitle: `Par ${String((post.author_info as { username?: unknown }).username ?? "")}`,
      url: `/posts/${post.id}`,
    })),
    ...resources.map((r) => {
      const resource = r as { id: number; title: string; subject: string };
      return {
        type: "resource",
        id: resource.id,
        text: resource.title,
        subtitle: resource.subject || "Ressource",
        url: `/resources/${resource.id}`,
      };
    }),
  ];

  res.status(200).json({
    success: true,
    data: suggestions,
    errors,
    query: q,
  });
});

/** Non-empty distinct values of a user text column, sorted. */
async function distinctUserValues(field: "university" | "faculty" | "studyYear" | "town"): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { [field]: { not: "" } } as Prisma.UserWhereInput,
    select: { [field]: true } as Record<string, boolean>,
    distinct: [field],
    orderBy: { [field]: "asc" } as Prisma.UserOrderByWithRelationInput,
  });
  return rows
    .map((row) => (row as unknown as Record<string, string | null>)[field])
    .filter((value): value is string => Boolean(value));
}

/**
 * @status UNUSED
 *
 * **[CHANGE]** Django grouped spheres by `type`, but the column is `sphere_type`,
 * so Django raised `FieldError` and this endpoint returned 500 on every call. It
 * has never once produced filter options.
 */
searchRouter.get("/filters/", requireAuth, async (_req, res) => {
  const [universities, faculties, studyYears, towns, categories, types, postSubjects, resourceSubjects, resourceTypes] =
    await Promise.all([
      distinctUserValues("university"),
      distinctUserValues("faculty"),
      distinctUserValues("studyYear"),
      distinctUserValues("town"),
      prisma.sphere.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.sphere.groupBy({ by: ["sphereType"], _count: { _all: true } }),
      prisma.post.findMany({ where: { subject: { not: "" } }, select: { subject: true }, distinct: ["subject"] }),
      prisma.resource.findMany({ where: { subject: { not: "" } }, select: { subject: true }, distinct: ["subject"] }),
      prisma.resource.groupBy({ by: ["type"], _count: { _all: true } }),
    ]);

  const byCountDesc = <T extends { _count: { _all: number } }>(rows: T[]): T[] =>
    [...rows].sort((a, b) => b._count._all - a._count._all);

  const subjects = [...new Set([...postSubjects, ...resourceSubjects].map((r) => r.subject).filter(Boolean))].sort();

  ok(res, {
    universities,
    faculties,
    study_years: studyYears,
    towns,
    sphere_categories: byCountDesc(categories).map((c) => ({
      category: c.category.toLowerCase(),
      count: c._count._all,
    })),
    sphere_types: byCountDesc(types).map((t) => ({
      sphere_type: t.sphereType.toLowerCase(),
      count: t._count._all,
    })),
    subjects,
    resource_types: byCountDesc(resourceTypes).map((t) => ({ type: t.type.toLowerCase(), count: t._count._all })),
  });
});
