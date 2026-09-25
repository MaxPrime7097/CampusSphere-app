const TRUTHY_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

function normalizeFlag(value?: string | boolean | null): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return `${value ?? ""}`.trim().toLowerCase();
}

export function isFeatureEnabled(value?: string | boolean | null): boolean {
  return TRUTHY_VALUES.has(normalizeFlag(value));
}

export const featureFlags = {
  ADMIN_PANEL_V2:
    import.meta.env.VITE_ADMIN_PANEL_V2 !== undefined
      ? isFeatureEnabled(import.meta.env.VITE_ADMIN_PANEL_V2)
      : true,
} as const;

