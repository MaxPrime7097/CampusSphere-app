export const SPHERE_CATEGORY_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "academic", label: "Académique" },
  { value: "professional", label: "Professionnel" },
  { value: "social", label: "Social" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
  { value: "technology", label: "Technologie" },
  { value: "other", label: "Autre" },
] as const;

export const SPHERE_TYPE_OPTIONS = [
  { value: "all", label: "Tous types" },
  { value: "study", label: "Étude" },
  { value: "project", label: "Projet" },
  { value: "club", label: "Club" },
  { value: "event", label: "Événement" },
  { value: "networking", label: "Réseautage" },
  { value: "other", label: "Autre" },
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

export const SPHERE_CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SPHERE_CATEGORY_OPTIONS.map((category) => [category.value, category.label])
);

export function getSphereCategoryLabel(category: string | undefined | null): string {
  if (!category) return "";
  const normalized = String(category).toLowerCase();
  return SPHERE_CATEGORY_LABEL_MAP[normalized] || category;
}
