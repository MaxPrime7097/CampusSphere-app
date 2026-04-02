export type AdminSectionKey =
  | "dashboard"
  | "users"
  | "spheres"
  | "moderation"
  | "resources"
  | "logs";

export interface AdminNavigationItem {
  key: AdminSectionKey;
  label: string;
  to: string;
  description: string;
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}
