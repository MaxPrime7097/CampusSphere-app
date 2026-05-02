import type { AdminNavigationItem } from "../types/common";

export const ADMIN_NAVIGATION: AdminNavigationItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/admin/dashboard",
    description: "Vue globale",
  },
  {
    key: "users",
    label: "Utilisateurs",
    to: "/admin/users",
    description: "Gestion des comptes",
  },
  {
    key: "spheres",
    label: "Sphères",
    to: "/admin/spheres",
    description: "Communautés",
  },
  {
    key: "moderation",
    label: "Modération contenu",
    to: "/admin/moderation",
    description: "Signalements",
  },
  {
    key: "verification",
    label: "Vérification Étudiants",
    to: "/admin/verification",
    description: "Cartes d'étudiant",
  },
  {
    key: "resources",
    label: "Ressources",
    to: "/admin/resources",
    description: "Validation",
  },
  {
    key: "logs",
    label: "Logs / Activité",
    to: "/admin/logs",
    description: "Historique système",
  },
];
