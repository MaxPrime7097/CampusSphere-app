// Configuration des features disponibles par type de sphère
// Miroir de spheres/sphere_config.py côté backend

export type SphereType =
  | 'cours'
  | 'projet'
  | 'club'
  | 'revision'
  | 'communaute'

export interface SphereFeatures {
  has_resources:     boolean
  has_announcements: boolean
  has_chat:          boolean
  has_sphera:        boolean
  has_kanban:        boolean
  has_tasks:         boolean
  has_events:        boolean
  has_feed:          boolean
}

export const SPHERE_FEATURES: Record<SphereType, SphereFeatures> = {
  cours: {
    has_resources:     true,
    has_announcements: true,
    has_chat:          true,
    has_sphera:        true,
    has_kanban:        false,
    has_tasks:         false,
    has_events:        false,
    has_feed:          false,
  },
  projet: {
    has_resources:     true,
    has_announcements: false,
    has_chat:          true,
    has_sphera:        false,
    has_kanban:        true,
    has_tasks:         true,
    has_events:        false,
    has_feed:          false,
  },
  club: {
    has_resources:     false,
    has_announcements: true,
    has_chat:          true,
    has_sphera:        false,
    has_kanban:        false,
    has_tasks:         false,
    has_events:        true,
    has_feed:          false,
  },
  revision: {
    has_resources:     true,
    has_announcements: false,
    has_chat:          true,
    has_sphera:        true,
    has_kanban:        false,
    has_tasks:         false,
    has_events:        false,
    has_feed:          false,
  },
  communaute: {
    has_resources:     true,
    has_announcements: false,
    has_chat:          true,
    has_sphera:        false,
    has_kanban:        false,
    has_tasks:         false,
    has_events:        false,
    has_feed:          true,
  },
}

export const getSphereFeatures = (type?: SphereType | string | null): SphereFeatures =>
  SPHERE_FEATURES[(type as SphereType) ?? 'communaute'] ?? SPHERE_FEATURES['communaute']

/** Libellés affichés dans le badge de type */
export const SPHERE_TYPE_LABELS: Record<SphereType, string> = {
  cours:      'Cours',
  projet:     'Projet',
  club:       'Club',
  revision:   'Révision',
  communaute: 'Communauté',
}

/** Icônes associées au type pour les badges */
export const SPHERE_TYPE_ICONS: Record<SphereType, any> = {
  cours:      'BookOpen',
  projet:     'Target',
  club:       'Trophy',
  revision:   'Pencil',
  communaute: 'Globe',
}

/** Couleurs Tailwind pour le badge de type */
export const SPHERE_TYPE_COLORS: Record<SphereType, string> = {
  cours:      'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  projet:     'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  club:       'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  revision:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  communaute: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
}

/** Options affichées dans CreateSphereModal (V1 — 3 types) */
export const SPHERE_TYPE_OPTIONS_V1 = [
  {
    value: 'cours' as SphereType,
    label: 'Sphère de Cours',
    description: 'Cours, TDs, annales & révision avec Sphera intégrée',
    iconName: 'book-open',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    value: 'projet' as SphereType,
    label: 'Sphère de Projet',
    description: 'Kanban, tâches assignées & fichiers partagés',
    iconName: 'target',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    value: 'communaute' as SphereType,
    label: 'Communauté',
    description: 'Espace ouvert pour une filière ou un intérêt commun',
    iconName: 'globe',
    gradient: 'from-sky-500 to-cyan-500',
  },
]
