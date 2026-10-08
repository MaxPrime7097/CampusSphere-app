import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/envelope.js";

export interface CampusMetadata {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  defaultOpen: boolean;
  targetCount: number;
}

export const CAMEROON_PRIVATE_CAMPUSES: CampusMetadata[] = [
  {
    slug: "iuc",
    name: "Institut Universitaire de la Côte (IUC)",
    shortName: "IUC",
    city: "Douala",
    defaultOpen: true, // Pilot campus, always unlocked
    targetCount: 50,
  },
  {
    slug: "iug",
    name: "Institut Universitaire du Golfe de Guinée (IUG)",
    shortName: "IUG",
    city: "Douala",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "saint_jerome",
    name: "Institut Catholique Saint Jérôme de Douala",
    shortName: "Saint Jérôme",
    city: "Douala",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "ucac",
    name: "Université Catholique d'Afrique Centrale (UCAC)",
    shortName: "UCAC",
    city: "Yaoundé",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "siantou",
    name: "Institut Universitaire Siantou (IUS)",
    shortName: "Siantou",
    city: "Yaoundé",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "ict_university",
    name: "ICT University",
    shortName: "ICT Univ",
    city: "Yaoundé",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "isj",
    name: "Institut Saint Jean (ISJ)",
    shortName: "ISJ",
    city: "Yaoundé",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "isma",
    name: "Institut Supérieur de Management (ISMA)",
    shortName: "ISMA",
    city: "Douala",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "jfn",
    name: "JFN University / JFN Center",
    shortName: "JFN",
    city: "Douala",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "istag",
    name: "Institut Supérieur de Technologie Appliquée et de Gestion (ISTAG)",
    shortName: "ISTAG",
    city: "Yaoundé",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "pigier",
    name: "Pigier Cameroun",
    shortName: "Pigier",
    city: "Douala / Yaoundé",
    defaultOpen: false,
    targetCount: 50,
  },
  {
    slug: "other",
    name: "Autre établissement privé",
    shortName: "Autre",
    city: "Cameroun",
    defaultOpen: false,
    targetCount: 50,
  },
];

export function resolveCampusSlug(raw?: string | null): string {
  if (!raw) return "iuc";
  const r = raw.toLowerCase().trim();
  if (r === "iuc" || r.includes("côte") || r.includes("cote")) return "iuc";
  if (r === "iug" || r.includes("golfe") || r.includes("guinée") || r.includes("guinee")) return "iug";
  if (r === "saint_jerome" || r.includes("jérôme") || r.includes("jerome")) return "saint_jerome";
  if (r === "ucac" || r.includes("ucac") || r.includes("catholique d'afrique")) return "ucac";
  if (r === "siantou" || r.includes("siantou")) return "siantou";
  if (r === "ict_university" || r.includes("ict")) return "ict_university";
  if (r === "isj" || r.includes("saint jean")) return "isj";
  if (r === "isma" || r.includes("isma")) return "isma";
  if (r === "jfn" || r.includes("jfn")) return "jfn";
  if (r === "istag" || r.includes("istag")) return "istag";
  if (r === "pigier" || r.includes("pigier")) return "pigier";
  if (r === "other" || r.includes("autre")) return "other";
  return r;
}

export function buildCampusFilter(slug: string): Prisma.UserWhereInput {
  const s = slug.toLowerCase().trim();
  switch (s) {
    case "iuc":
      return {
        OR: [
          { university: { equals: "iuc", mode: "insensitive" } },
          { university: { contains: "Institut Universitaire de la Côte", mode: "insensitive" } },
          { university: { contains: "IUC", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "iug":
      return {
        OR: [
          { university: { equals: "iug", mode: "insensitive" } },
          { university: { contains: "Golfe de Guinée", mode: "insensitive" } },
          { university: { contains: "IUG", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "saint_jerome":
      return {
        OR: [
          { university: { equals: "saint_jerome", mode: "insensitive" } },
          { university: { contains: "Saint Jérôme", mode: "insensitive" } },
          { university: { contains: "Saint Jerome", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "ucac":
      return {
        OR: [
          { university: { equals: "ucac", mode: "insensitive" } },
          { university: { contains: "UCAC", mode: "insensitive" } },
          { university: { contains: "Afrique Centrale", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "siantou":
      return {
        OR: [
          { university: { equals: "siantou", mode: "insensitive" } },
          { university: { contains: "Siantou", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "ict_university":
      return {
        OR: [
          { university: { equals: "ict_university", mode: "insensitive" } },
          { university: { contains: "ICT", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "isj":
      return {
        OR: [
          { university: { equals: "isj", mode: "insensitive" } },
          { university: { contains: "Saint Jean", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "isma":
      return {
        OR: [
          { university: { equals: "isma", mode: "insensitive" } },
          { university: { contains: "ISMA", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "jfn":
      return {
        OR: [
          { university: { equals: "jfn", mode: "insensitive" } },
          { university: { contains: "JFN", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "istag":
      return {
        OR: [
          { university: { equals: "istag", mode: "insensitive" } },
          { university: { contains: "ISTAG", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "pigier":
      return {
        OR: [
          { university: { equals: "pigier", mode: "insensitive" } },
          { university: { contains: "Pigier", mode: "insensitive" } },
        ],
        isActive: true,
      };
    case "other":
      return {
        OR: [
          { university: { equals: "other", mode: "insensitive" } },
          { university: { contains: "Autre", mode: "insensitive" } },
        ],
        isActive: true,
      };
    default:
      return {
        university: { equals: slug, mode: "insensitive" },
        isActive: true,
      };
  }
}

export async function getCampusStatus(req: Request, res: Response): Promise<void> {
  let targetSlug: string = typeof req.query.slug === "string" ? req.query.slug.trim() : "";

  if (!targetSlug && req.user) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { university: true },
    });
    if (user?.university) {
      targetSlug = user.university;
    }
  }

  const resolvedSlug = resolveCampusSlug(targetSlug);

  // Compute counts for all tracked campuses
  const campusStats = await Promise.all(
    CAMEROON_PRIVATE_CAMPUSES.map(async (campus) => {
      const count = await prisma.user.count({
        where: buildCampusFilter(campus.slug),
      });
      const isOpen = campus.defaultOpen || count >= campus.targetCount;
      const remainingCount = Math.max(0, campus.targetCount - count);
      const percentage = campus.defaultOpen
        ? 100
        : Math.min(100, Math.round((count / campus.targetCount) * 100));

      return {
        slug: campus.slug,
        name: campus.name,
        shortName: campus.shortName,
        city: campus.city,
        isOpen,
        currentCount: count,
        targetCount: campus.targetCount,
        remainingCount,
        percentage,
      };
    })
  );

  let currentCampus = campusStats.find((c) => c.slug === resolvedSlug);

  if (!currentCampus) {
    // If not in known list, count dynamically
    const count = await prisma.user.count({
      where: buildCampusFilter(resolvedSlug),
    });
    currentCampus = {
      slug: resolvedSlug,
      name: targetSlug || "Mon Université",
      shortName: targetSlug || "Mon Université",
      city: "Cameroun",
      isOpen: count >= 50,
      currentCount: count,
      targetCount: 50,
      remainingCount: Math.max(0, 50 - count),
      percentage: Math.min(100, Math.round((count / 50) * 100)),
    };
  }

  ok(res, {
    ...currentCampus,
    campuses: campusStats,
  });
}
