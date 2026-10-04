// Configuration des features disponibles par type de sphère
// Miroir de spheres/sphere_config.py côté backend

export type CanonicalSphereType = 'cours' | 'projet' | 'communaute'
export type SphereType = CanonicalSphereType | 'club' | 'revision'

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
    has_sphera:        true,
    has_kanban:        true,
    has_tasks:         true,
    has_events:        false,
    has_feed:          false,
  },
  communaute: {
    has_resources:     true,
    has_announcements: true,
    has_chat:          true,
    has_sphera:        false,
    has_kanban:        false,
    has_tasks:         false,
    has_events:        true,
    has_feed:          false,
  },
  // Rétrocompatibilité données historiques :
  club: {
    has_resources:     true,
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
    has_announcements: true,
    has_chat:          true,
    has_sphera:        true,
    has_kanban:        false,
    has_tasks:         false,
    has_events:        false,
    has_feed:          false,
  },
}

export function normalizeSphereType(rawType?: string | null): CanonicalSphereType {
  if (!rawType) return 'communaute';
  const t = String(rawType).trim().toLowerCase();
  if (['cours', 'course', 'revision', 'study', 'academic'].includes(t)) return 'cours';
  if (['projet', 'project', 'professional'].includes(t)) return 'projet';
  if (['communaute', 'club', 'community', 'social', 'sports', 'arts', 'technology', 'other'].includes(t)) return 'communaute';
  return 'communaute';
}

export const getSphereFeatures = (type?: SphereType | string | null): SphereFeatures => {
  const canonical = normalizeSphereType(type);
  return SPHERE_FEATURES[canonical] ?? SPHERE_FEATURES['communaute'];
};

/** Libellés affichés dans le badge de type */
export const SPHERE_TYPE_LABELS: Record<SphereType, string> = {
  cours:      'Cours',
  projet:     'Projet',
  communaute: 'Communauté',
  club:       'Communauté',
  revision:   'Cours',
}

/** Icônes associées au type pour les badges */
export const SPHERE_TYPE_ICONS: Record<SphereType, any> = {
  cours:      'BookOpen',
  projet:     'Target',
  communaute: 'UsersFour',
  club:       'UsersFour',
  revision:   'BookOpen',
}

/** Couleurs Tailwind pour le badge de type */
export const SPHERE_TYPE_COLORS: Record<SphereType, string> = {
  cours:      'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  projet:     'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  communaute: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  club:       'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  revision:   'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
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
    description: 'Espace ouvert pour une filière, association ou promotion',
    iconName: 'users-four',
    gradient: 'from-sky-500 to-cyan-500',
  },
]
