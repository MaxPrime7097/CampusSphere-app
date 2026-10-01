const STORAGE_KEY = "cs_resource_impact_ratings";

export interface StoredRatingData {
  rating: number | null;
  impactScore?: number;
}

export function getStoredResourceRating(resourceId: string | number): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const val = parsed[String(resourceId)];
    if (typeof val === "number") return val;
    if (val && typeof val === "object" && typeof val.rating === "number") {
      return val.rating;
    }
    return null;
  } catch {
    return null;
  }
}

export function getStoredResourceImpactScore(resourceId: string | number): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const val = parsed[String(resourceId)];
    if (val && typeof val === "object" && typeof val.impactScore === "number") {
      return val.impactScore;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredResourceRating(
  resourceId: string | number,
  value: number | null,
  impactScore?: number
): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const key = String(resourceId);

    if (value === null) {
      if (typeof impactScore === "number") {
        parsed[key] = { rating: null, impactScore };
      } else {
        delete parsed[key];
      }
    } else {
      parsed[key] = {
        rating: value,
        ...(typeof impactScore === "number" ? { impactScore } : {}),
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    window.dispatchEvent(
      new CustomEvent("resource-impact-changed", {
        detail: { resourceId: key, value, impactScore },
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}
