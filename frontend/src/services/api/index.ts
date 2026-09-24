/**
 * CampusSphere API Client & Service Registry
 * Modular architecture re-exporting domain-specific API modules.
 */

export * from "./client";
export * from "./auth.api";
export * from "./users.api";
export * from "./spheres.api";
export * from "./posts.api";
export * from "./resources.api";
export * from "./tasks.api";
export * from "./messages.api";
export * from "./notifications.api";
export * from "./admin.api";
export * from "./common.api";
export * from "./sphera.api";

import { apiFetch } from "./client";
export const http = { apiFetch };
