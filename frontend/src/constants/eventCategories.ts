export const EVENT_CATEGORY_OPTIONS = [
  { 
    value: "all", 
    label: "Toutes les catégories", 
    shortLabel: "Toutes",
    icon: "Calendar",
    color: "bg-primary/10 text-primary border-primary/20",
    gradient: "from-primary to-indigo-700",
  },
  { 
    value: "party", 
    label: "Soirées & Cérémonies", 
    shortLabel: "Soirée / Cérémonie",
    description: "Welcome Week, Welcome Ceremony, galas et soirées étudiantes",
    icon: "Sparkles",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    gradient: "from-purple-700 to-indigo-800",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  { 
    value: "competition", 
    label: "Compétitions & Concours", 
    shortLabel: "Compétition",
    description: "MathScam, tournois académiques, e-sport et défis inter-campus",
    icon: "Trophy",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    gradient: "from-blue-700 to-indigo-900",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  { 
    value: "hackathon", 
    label: "Hackathons & Code", 
    shortLabel: "Hackathon",
    description: "Marathons de programmation, game jams et projets tech",
    icon: "Code",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    gradient: "from-indigo-700 to-slate-900",
    badgeClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  { 
    value: "conference", 
    label: "Conférences & Talks", 
    shortLabel: "Conférence",
    description: "Tables rondes, masterclasses, keynotes et interventions d'experts",
    icon: "Mic",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    gradient: "from-slate-800 via-primary/80 to-zinc-900",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  { 
    value: "workshop", 
    label: "Ateliers & Workshops", 
    shortLabel: "Atelier",
    description: "Formations pratiques, séances de révision et tutorats de groupe",
    icon: "BookOpen",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    gradient: "from-violet-700 to-indigo-800",
    badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  },
  { 
    value: "other", 
    label: "Autres événements", 
    shortLabel: "Autre",
    description: "Rencontres sportives, sorties culturelles et activités diverses",
    icon: "Compass",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    gradient: "from-zinc-800 to-zinc-950",
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  },
] as const;

export type EventCategoryType = typeof EVENT_CATEGORY_OPTIONS[number]["value"];

export const EVENT_CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  EVENT_CATEGORY_OPTIONS.map((cat) => [cat.value, cat.label])
);

export const EVENT_CATEGORY_BADGE_MAP: Record<string, string> = Object.fromEntries(
  EVENT_CATEGORY_OPTIONS.map((cat) => [cat.value, (cat as any).badgeClass || "bg-primary/10 text-primary"])
);

export function getEventCategoryMeta(category: string | undefined | null) {
  if (!category) return EVENT_CATEGORY_OPTIONS.find(c => c.value === "other")!;
  const found = EVENT_CATEGORY_OPTIONS.find((c) => c.value.toLowerCase() === category.toLowerCase());
  return found || EVENT_CATEGORY_OPTIONS.find(c => c.value === "other")!;
}

export function getEventCategoryLabel(category: string | undefined | null): string {
  if (!category) return "Événement";
  const meta = getEventCategoryMeta(category);
  return meta.shortLabel || meta.label || category;
}
