/**
 * Feature matrix by sphere type.
 *
 * Mirrored verbatim in the frontend at `src/config/sphereFeatures.ts`, which is why
 * `GET /api/spheres/<id>/features/` shows as UNUSED in the inventory — the client
 * reads its local copy rather than fetching. The two must not drift; the contract
 * suite asserts a representative subset against this table.
 */

import { SphereType } from "@prisma/client";

export interface SphereFeatures {
  has_resources: boolean;
  has_announcements: boolean;
  has_chat: boolean;
  has_sphera: boolean;
  has_kanban: boolean;
  has_tasks: boolean;
  has_events: boolean;
  has_feed: boolean;
}

const FEATURES: Record<SphereType, SphereFeatures> = {
  COURS: {
    has_resources: true,
    has_announcements: true,
    has_chat: true,
    has_sphera: true,
    has_kanban: false,
    has_tasks: false,
    has_events: false,
    has_feed: false,
  },
  PROJET: {
    has_resources: true,
    has_announcements: false,
    has_chat: true,
    has_sphera: false,
    has_kanban: true,
    has_tasks: true,
    has_events: false,
    has_feed: false,
  },
  CLUB: {
    has_resources: false,
    has_announcements: true,
    has_chat: true,
    has_sphera: false,
    has_kanban: false,
    has_tasks: false,
    has_events: true,
    has_feed: false,
  },
  REVISION: {
    has_resources: true,
    has_announcements: false,
    has_chat: true,
    has_sphera: true,
    has_kanban: false,
    has_tasks: false,
    has_events: false,
    has_feed: false,
  },
  COMMUNAUTE: {
    has_resources: true,
    has_announcements: false,
    has_chat: true,
    has_sphera: false,
    has_kanban: false,
    has_tasks: false,
    has_events: false,
    has_feed: true,
  },
};

/** Unknown types fall back to COMMUNAUTE, matching the Django and client behaviour. */
export function getSphereFeatures(type: SphereType): SphereFeatures {
  return FEATURES[type] ?? FEATURES.COMMUNAUTE;
}

/**
 * Translate a free-text duration into an expiry date.
 *
 * Ported from Django's `Sphere.compute_expiry_from_duration`, including its
 * substring matching — the client sends human labels ("court terme", "3 mois")
 * rather than a fixed enum. Anything permanent, flexible or unrecognised yields
 * null, meaning the sphere never expires.
 */
export function computeExpiry(duration: string | null | undefined, from: Date = new Date()): Date | null {
  if (!duration) return null;
  const normalised = duration.trim().toLowerCase();

  const day = 24 * 60 * 60 * 1000;
  const mappings: Array<[string[], number]> = [
    [["court terme", "1-3 mois", "short term"], 90],
    [["moyen terme", "3-6 mois", "medium term"], 180],
    [["long terme", "6-12 mois", "long term"], 365],
    [["1 semaine", "week"], 7],
    [["1 mois", "month"], 30],
    [["3 mois"], 90],
    [["6 mois"], 180],
    [["12 mois", "1 an", "1 year"], 365],
  ];

  for (const [keywords, days] of mappings) {
    if (keywords.some((k) => normalised.includes(k))) {
      return new Date(from.getTime() + days * day);
    }
  }

  return null;
}
