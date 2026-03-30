export const CANONICAL_RESOURCE_TYPES = [
  "notes",
  "resumes",
  "exercises",
  "projects",
  "presentations",
] as const;

export type CanonicalResourceType = (typeof CANONICAL_RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_ALIASES: Record<string, CanonicalResourceType> = {
  summary: "resumes",
  slides: "presentations",
};

export const RESOURCE_TYPE_OPTIONS: Array<{ value: CanonicalResourceType; label: string }> = [
  { value: "notes", label: "Notes de cours" },
  { value: "resumes", label: "Résumés" },
  { value: "exercises", label: "Exercices" },
  { value: "projects", label: "Projets" },
  { value: "presentations", label: "Présentations" },
];

export function normalizeResourceType(type: unknown): CanonicalResourceType {
  const normalized = typeof type === "string" ? type.trim().toLowerCase() : "";
  if (normalized in RESOURCE_TYPE_ALIASES) {
    return RESOURCE_TYPE_ALIASES[normalized];
  }
  if ((CANONICAL_RESOURCE_TYPES as readonly string[]).includes(normalized)) {
    return normalized as CanonicalResourceType;
  }
  return "notes";
}
