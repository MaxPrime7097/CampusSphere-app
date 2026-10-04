export const SPHERE_CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes les catégories" },
  { value: "cours", label: "Cours" },
  { value: "projet", label: "Projet" },
  { value: "communaute", label: "Communauté" },
] as const;

export const SPHERE_TYPE_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "cours", label: "Cours" },
  { value: "projet", label: "Projet" },
  { value: "communaute", label: "Communauté" },
] as const;

export const SPHERE_AUDIENCE_OPTIONS = [
  { value: "all", label: "Tous publics" },
  { value: "Tous les étudiants", label: "Tous les étudiants" },
  { value: "Étudiants en informatique", label: "Étudiants en informatique" },
  { value: "Étudiants en business", label: "Étudiants en business" },
  { value: "Étudiants en sciences", label: "Étudiants en sciences" },
  { value: "Étudiants en arts", label: "Étudiants en arts" },
  { value: "Étudiants en médecine", label: "Étudiants en médecine" },
  { value: "Étudiants en ingénierie", label: "Étudiants en ingénierie" },
  { value: "Étudiants en droit", label: "Étudiants en droit" },
  { value: "Étudiants en économie", label: "Étudiants en économie" },
  { value: "Autre", label: "Autre" },
] as const;

export const SPHERE_CATEGORY_LABEL_MAP: Record<string, string> = {
  all: "Toutes",
  cours: "Cours",
  projet: "Projet",
  communaute: "Communauté",
  course: "Cours",
  project: "Projet",
  community: "Communauté",
  academic: "Cours",
  revision: "Cours",
  study: "Cours",
  professional: "Projet",
  social: "Communauté",
  sports: "Communauté",
  arts: "Communauté",
  technology: "Communauté",
  club: "Communauté",
  other: "Communauté",
};

export function getSphereCategoryLabel(category: string | undefined | null): string {
  if (!category) return "";
  const normalized = String(category).toLowerCase();
  return SPHERE_CATEGORY_LABEL_MAP[normalized] || category;
}
