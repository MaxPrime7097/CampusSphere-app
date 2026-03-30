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

export const SPHERE_CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  SPHERE_CATEGORY_OPTIONS.map((category) => [category.value, category.label])
);

export function getSphereCategoryLabel(category: string | undefined | null): string {
  if (!category) return "";
  const normalized = String(category).toLowerCase();
  return SPHERE_CATEGORY_LABEL_MAP[normalized] || category;
}
