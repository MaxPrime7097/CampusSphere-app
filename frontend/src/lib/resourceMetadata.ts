import { RESOURCE_TYPE_ALIASES, RESOURCE_TYPE_OPTIONS, type CanonicalResourceType } from "@/constants/resourceTypes";

const FALLBACK_OTHER = "Autre";
const FALLBACK_UNDEFINED = "Non défini";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Tous les niveaux",
  bts1: "BTS 1",
  bts2: "BTS 2",
  hnd1: "HND 1",
  hnd2: "HND 2",
  l1: "Licence 1",
  l2: "Licence 2",
  l3: "Licence 3",
  bachelor1: "Bachelor 1",
  bachelor2: "Bachelor 2",
  bachelor3: "Bachelor 3",
  bachelor4: "Bachelor 4",
  m1: "Master 1",
  m2: "Master 2",
  d1: "Doctorat 1",
  d2: "Doctorat 2",
  d3: "Doctorat 3",
  phd1: "PhD 1",
  phd2: "PhD 2",
  phd3: "PhD 3",
  other: FALLBACK_OTHER,
};

const AUDIENCE_ALIASES: Record<string, string> = {
  all: "all",
  "bts 1": "bts1",
  "bts 2": "bts2",
  "hnd 1": "hnd1",
  "hnd 2": "hnd2",
  "licence 1": "l1",
  "licence 2": "l2",
  "licence 3": "l3",
  "master 1": "m1",
  "master 2": "m2",
  "doctorat 1": "d1",
  "doctorat 2": "d2",
  "doctorat 3": "d3",
  "phd 1": "phd1",
  "phd 2": "phd2",
  "phd 3": "phd3",
  bachelor: "bachelor1",
  "autre niveau": "other",
  autre: "other",
};

const SUBJECT_OPTIONS = [
  { value: "math", label: "Mathématiques" },
  { value: "cs", label: "Informatique" },
  { value: "physics", label: "Physique" },
  { value: "economics", label: "Économie" },
  { value: "language", label: "Langues" },
  { value: "other", label: FALLBACK_OTHER },
] as const;

type CanonicalSubject = (typeof SUBJECT_OPTIONS)[number]["value"];

const SUBJECT_LABELS: Record<CanonicalSubject, string> = Object.fromEntries(
  SUBJECT_OPTIONS.map((subject) => [subject.value, subject.label])
) as Record<CanonicalSubject, string>;

const SUBJECT_ALIASES: Record<string, CanonicalSubject> = {
  maths: "math",
  mathematiques: "math",
  mathématiques: "math",
  mathematique: "math",
  "mathématique": "math",
  informatique: "cs",
  "computer science": "cs",
  informatique_generale: "cs",
  programmation: "cs",
  economie: "economics",
  économie: "economics",
  eco: "economics",
  langues: "language",
  langue: "language",
  french: "language",
  anglais: "language",
  autre: "other",
};

const CATEGORY_LABELS: Record<string, string> = {
  academic: "Académique",
  professional: "Professionnel",
  social: "Social",
  sports: "Sports",
  arts: "Arts",
  technology: "Technologie",
  general: "Général",
  autre: FALLBACK_OTHER,
  other: FALLBACK_OTHER,
};

const CATEGORY_ALIASES: Record<string, string> = {
  acad: "academic",
  academics: "academic",
  pro: "professional",
  société: "social",
  societe: "social",
  tech: "technology",
  technologies: "technology",
  général: "general",
  generale: "general",
  académique: "academic",
  academique: "academic",
  professionnel: "professional",
  social: "social",
  sports: "sports",
  arts: "arts",
  technologie: "technology",
  general: "general",
  autre: "other",
};

const RESOURCE_TYPE_LABELS: Record<CanonicalResourceType, string> = Object.fromEntries(
  RESOURCE_TYPE_OPTIONS.map((type) => [type.value, type.label])
) as Record<CanonicalResourceType, string>;

const RESOURCE_TYPE_LEGACY_ALIASES: Record<string, CanonicalResourceType> = {
  note: "notes",
  "notes de cours": "notes",
  resume: "resumes",
  résumé: "resumes",
  résumés: "resumes",
  exercice: "exercises",
  exercices: "exercises",
  project: "projects",
  projet: "projects",
  presentation: "presentations",
  présentation: "presentations",
  présentations: "presentations",
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeCategory(category: unknown): string {
  const normalized = normalizeText(category);
  if (!normalized) return "";
  return CATEGORY_ALIASES[normalized] || normalized;
}

export function getCategoryLabel(category: unknown): string {
  const normalized = normalizeCategory(category);
  if (!normalized) return FALLBACK_UNDEFINED;
  return CATEGORY_LABELS[normalized] || FALLBACK_OTHER;
}

export function normalizeSubject(subject: unknown): CanonicalSubject {
  const normalized = normalizeText(subject);
  if (!normalized) return "other";
  if (normalized in SUBJECT_ALIASES) {
    return SUBJECT_ALIASES[normalized];
  }

  const directMatch = SUBJECT_OPTIONS.find((option) => option.value === normalized);
  return directMatch ? directMatch.value : "other";
}

export function getSubjectLabel(subject: unknown): string {
  const normalized = normalizeSubject(subject);
  return SUBJECT_LABELS[normalized] || FALLBACK_OTHER;
}

export function normalizeResourceType(type: unknown): CanonicalResourceType | null {
  const normalized = normalizeText(type);
  if (!normalized) return null;
  if (normalized in RESOURCE_TYPE_ALIASES) {
    return RESOURCE_TYPE_ALIASES[normalized];
  }
  if (normalized in RESOURCE_TYPE_LEGACY_ALIASES) {
    return RESOURCE_TYPE_LEGACY_ALIASES[normalized];
  }

  const directMatch = RESOURCE_TYPE_OPTIONS.find((option) => option.value === normalized);
  return directMatch ? directMatch.value : null;
}

export function getTypeLabel(type: unknown): string {
  const normalized = normalizeResourceType(type);
  return normalized ? RESOURCE_TYPE_LABELS[normalized] : FALLBACK_UNDEFINED;
}

export function normalizeAudience(audience: unknown): string {
  const normalized = normalizeText(audience);
  if (!normalized) return "";
  if (normalized in AUDIENCE_ALIASES) {
    return AUDIENCE_ALIASES[normalized];
  }

  return normalized;
}

export function getAudienceLabel(audience: unknown): string {
  const normalized = normalizeAudience(audience);
  if (!normalized) return FALLBACK_UNDEFINED;
  return AUDIENCE_LABELS[normalized] || FALLBACK_OTHER;
}

// Backward compatibility: existing imports still work.
export const getResourceTypeLabel = getTypeLabel;
