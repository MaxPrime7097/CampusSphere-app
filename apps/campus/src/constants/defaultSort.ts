export const SEARCH_SORT_KEYS = ["relevance", "name"] as const;
export type SearchSortKey = (typeof SEARCH_SORT_KEYS)[number];

export const RESOURCE_SORT_KEYS = ["all", "suggestions", "recent"] as const;
export type ResourceSortKey = (typeof RESOURCE_SORT_KEYS)[number];

export const SPHERE_SORT_KEYS = ["discover", "mySpheres", "top"] as const;
export type SphereSortKey = (typeof SPHERE_SORT_KEYS)[number];

export const DEFAULT_SORT = {
  search: "relevance",
  resources: "all",
  spheres: "discover",
} as const satisfies {
  search: SearchSortKey;
  resources: ResourceSortKey;
  spheres: SphereSortKey;
};

export function ensureValidSortKey<T extends string>(
  value: string,
  options: readonly T[],
  fallback: T
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}
