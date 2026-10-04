/**
 * SSO Shared Constants & Origin Whitelists
 */

export const SSO_MESSAGE_TYPE = "cs_sso" as const;
export const SSO_NONE_TYPE = "cs_sso_none" as const;

export const CAMPUS_ORIGINS: readonly string[] = [
  "https://campussphere.app",
  "https://www.campussphere.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
] as const;

export const SPHERA_ORIGINS: readonly string[] = [
  "https://sphera.campussphere.app",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
] as const;

export function isAllowedSpheraOrigin(origin: string): boolean {
  if (!origin) return false;
  return SPHERA_ORIGINS.includes(origin) || origin.endsWith(".campussphere.app");
}

export function isAllowedCampusOrigin(origin: string): boolean {
  if (!origin) return false;
  return CAMPUS_ORIGINS.includes(origin) || origin.endsWith(".campussphere.app");
}
