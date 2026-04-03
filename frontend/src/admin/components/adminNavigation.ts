import type { AdminNavigationItem } from "../types/common";

export const ADMIN_NAVIGATION: AdminNavigationItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/cs-inc/private/admin/dashboard",
    description: "Vue globale",
  },
  {
    key: "users",
    label: "Utilisateurs",
    to: "/cs-inc/private/admin/users",
    description: "Gestion des comptes",
  },
  {
    key: "spheres",
    label: "Sphères",
    to: "/cs-inc/private/admin/spheres",
    description: "Communautés",
  },
  {
    key: "moderation",
    label: "Modération contenu",
    to: "/cs-inc/private/admin/moderation",
    description: "Signalements",
  },
  {
    key: "resources",
    label: "Ressources",
    to: "/cs-inc/private/admin/resources",
    description: "Validation",
  },
  {
    key: "logs",
    label: "Logs / Activité",
    to: "/cs-inc/private/admin/logs",
    description: "Historique système",
  },
];
