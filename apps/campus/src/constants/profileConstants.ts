import { Crown, Fire, Plant, Star, Trophy, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { formatSlugToLabel } from "@/lib/utils";
import { FACULTY_BILINGUAL_MAP } from "@/constants/academicData";

export const NOT_AVAILABLE_TEXT = "...";

export const MOOD_OPTIONS = [
  { value: "excited", label: "🚀🔥 En pleine révision !" },
  { value: "focused", label: "🎯🧠 Concentré sur mes objectifs" },
  { value: "collaborating", label: "🤝✨ Prêt à collaborer" },
  { value: "learning", label: "📚💡 En mode apprentissage" },
  { value: "inspired", label: "🌟🎨 Inspiré et créatif" },
  { value: "determined", label: "💪🏆 Déterminé" },
  { value: "stress", label: "📈🆘 Sous l'eau" },
  { value: "bu_hermit", label: "📚🕯️😶‍🌫️ L'Ermite de la BU" },
  { value: "caffeine_hunt", label: "☕🧟‍♂️ En quête de caféine" },
  { value: "liberated", label: "🍻🎉🔓 Libéré / Délivré" },
  { value: "networker", label: "🤝💼✨ Le Networker" },
  { value: "sleep_mode", label: "💤😴🚫 Mode Sommeil" },
];

export const MOOD_VALUE_TO_LABEL = MOOD_OPTIONS.reduce<Record<string, string>>((acc, mood) => {
  acc[mood.value] = mood.label;
  return acc;
}, {});

export interface ImpactLevel {
  min: number;
  label: string;
  color: string;
  icon: PhosphorIcon;
}

export const IMPACT_LEVELS: readonly ImpactLevel[] = [
  {
    min: 0,
    label: "Nouveau venu",
    color: "bg-zinc-100 text-zinc-600 border-zinc-200/90 dark:bg-zinc-800/90 dark:text-zinc-300 dark:border-zinc-700",
    icon: Plant,
  },
  {
    min: 50,
    label: "Contributeur",
    color: "bg-slate-100 text-slate-700 border-slate-300/90 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700",
    icon: Star,
  },
  {
    min: 200,
    label: "Pilier du Campus",
    color: "bg-stone-200/80 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600",
    icon: Fire,
  },
  {
    min: 500,
    label: "Maître du Campus",
    color: "bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
    icon: Trophy,
  },
  {
    min: 1000,
    label: "Légende du Campus",
    color: "bg-zinc-900 text-amber-400 border-zinc-700 dark:bg-zinc-100 dark:text-amber-700 dark:border-zinc-300",
    icon: Crown,
  },
];

export function getImpactLevelInfo(score: number) {
  let currentLevel = IMPACT_LEVELS[0];
  let nextLevel = IMPACT_LEVELS[1] || null;

  for (let i = 0; i < IMPACT_LEVELS.length; i++) {
    if (score >= IMPACT_LEVELS[i].min) {
      currentLevel = IMPACT_LEVELS[i];
      nextLevel = IMPACT_LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  const progress = nextLevel
    ? ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  return { currentLevel, nextLevel, progress };
}

export function getMoodLabel(moodValue?: string | null) {
  if (!moodValue) {
    return NOT_AVAILABLE_TEXT;
  }

  return MOOD_VALUE_TO_LABEL[moodValue] ?? moodValue;
}

export function findMoodOptionByValue(moodValue?: string | null) {
  if (!moodValue) {
    return null;
  }

  return MOOD_OPTIONS.find((option) => option.value === moodValue) ?? null;
}

export const STUDY_YEAR_LABELS: Record<string, string> = {
  bts1: "BTS 1/HND 1",
  bts2: "BTS 2/HND 2",
  l1: "Licence 1/Bachelor 1",
  l2: "Licence 2/Bachelor 2",
  l3: "Licence 3/Bachelor 3",
  l4: "Licence 4/Bachelor 4",
  m1: "Master 1",
  m2: "Master 2",
  d1: "Doctorat 1/PhD 1",
  d2: "Doctorat 2/PhD 2",
  d3: "Doctorat 3/PhD 3",
  other: "Autre niveau",
};

export const FACULTY_LABELS: Record<string, string> = {
  ...FACULTY_BILINGUAL_MAP,
};

export const UNIVERSITIES_LIST = [
  "Université de Yaoundé I",
  "Université de Yaoundé II",
  "Université de Douala",
  "Université de Buea",
  "Université de Bamenda",
  "Université de Dschang",
  "Université de Ngaoundéré",
  "Université de Maroua",
  "Université de Bertoua",
  "Université d'Ebolowa",
  "Université de Garoua",
  "Université Inter-États Congo-Cameroun",
  "Université Catholique d'Afrique Centrale",
  "ICT University",
  "PKFokam Institute of Excellence",
  "Saint Jerome Catholic University",
  "Ndi Samba University",
];

export const UNIVERSITY_OPTIONS = UNIVERSITIES_LIST.map((u) => ({ value: u, label: u }));
export const FACULTY_OPTIONS = Object.entries(FACULTY_LABELS).map(([value, label]) => ({ value, label }));
export const STUDY_YEAR_OPTIONS = Object.entries(STUDY_YEAR_LABELS).map(([value, label]) => ({ value, label }));

export const normalizeCanonicalLabel = (value: unknown, map: Record<string, string>): string => {
  if (!value || typeof value !== "string") return "";
  const key = value.trim().toLowerCase();
  return map[key] || formatSlugToLabel(value);
};

export const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return String(value);
};
