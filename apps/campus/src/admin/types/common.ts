import type { Icon as LucideIcon } from "@phosphor-icons/react";

export type AdminSectionKey =
  | "dashboard"
  | "users"
  | "verification"
  | "spheres"
  | "moderation"
  | "resources"
  | "logs"
  | "sphera"
  | "contact";

export interface AdminNavigationItem {
  key: AdminSectionKey;
  label: string;
  to: string;
  description: string;
  icon: LucideIcon;
  group: "Vue d'ensemble" | "Communauté & Contenu" | "Sécurité & Audit";
  badgeKey?: "pendingVerification" | "pendingReports" | "unreadContact";
}

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

