// ─── 6 catégories canoniques CampusSphere ─────────────────────────────────
export const CANONICAL_RESOURCE_TYPES = [
  "course_notes",
  "td_tp",
  "exams",
  "project",
  "book",
  "other",
] as const;

export type CanonicalResourceType = (typeof CANONICAL_RESOURCE_TYPES)[number];

/** Map ancien type → canonical (rétro-compatibilité DB + anciens uploads) */
export const RESOURCE_TYPE_ALIASES: Record<string, CanonicalResourceType> = {
  // anciens noms legacy
  notes:         "course_notes",
  resumes:       "course_notes",
  summary:       "course_notes",
  resume:        "course_notes",
  cours:         "course_notes",
  // td/tp
  exercises:     "td_tp",
  exercices:     "td_tp",
  td:            "td_tp",
  tp:            "td_tp",
  "td/tp":       "td_tp",
  "td_tp":       "td_tp",
  // annales
  exam_papers:   "exams",
  annales:       "exams",
  annale:        "exams",
  exam:          "exams",
  // projets
  projects:      "project",
  projet:        "project",
  presentations: "project",
  slides:        "project",
  // livres
  livre:         "book",
  books:         "book",
  // autre
  other:         "other",
};

export const RESOURCE_TYPE_OPTIONS: Array<{ value: CanonicalResourceType; label: string }> = [
  { value: "course_notes", label: "Note de cours" },
  { value: "td_tp",        label: "TD / TP" },
  { value: "exams",        label: "Annale" },
  { value: "project",      label: "Projet" },
  { value: "book",         label: "Livre" },
  { value: "other",        label: "Autre" },
];

/** Display labels (uppercase, as shown on cards) */
export const RESOURCE_TYPE_DISPLAY: Record<CanonicalResourceType, string> = {
  course_notes: "NOTE DE COURS",
  td_tp:        "TD / TP",
  exams:        "ANNALE",
  project:      "PROJET",
  book:         "LIVRE",
  other:        "AUTRE",
};

export function normalizeResourceType(type: unknown): CanonicalResourceType {
  const normalized =
    typeof type === "string" ? type.trim().toLowerCase().replace(/\s+/g, "_") : "";
  if (normalized in RESOURCE_TYPE_ALIASES) {
    return RESOURCE_TYPE_ALIASES[normalized];
  }
  if ((CANONICAL_RESOURCE_TYPES as readonly string[]).includes(normalized)) {
    return normalized as CanonicalResourceType;
  }
  return "other";
}
