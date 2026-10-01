import { formatSlugToLabel } from "@/lib/utils";

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

export const IMPACT_LEVELS = [
  { min: 0, label: "Nouveau venu", color: "from-gray-400 to-gray-500", icon: "🌱" },
  { min: 50, label: "Contributeur", color: "from-blue-400 to-blue-600", icon: "⭐" },
  { min: 200, label: "Pilier du Campus", color: "from-orange-400 to-orange-600", icon: "🏆" },
  { min: 500, label: "Légende du Campus", color: "from-purple-500 to-indigo-600", icon: "👑" },
  { min: 1000, label: "Maître Campus", color: "from-yellow-400 to-red-600", icon: "🔥" },
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
  // Sciences de la Santé
  medecine: "Médecine générale",
  pharmacie: "Pharmacie",
  veterinaire: "Vétérinaire",
  odontostomatologie: "Odontostomatologie (Chirurgie dentaire)",
  sciences_infirmieres: "Sciences infirmières",
  sage_femme: "Sage-femme / Maïeutique",
  techniques_laboratoire: "Techniques de laboratoire médical",
  radiologie: "Radiologie / Imagerie médicale",
  sante_publique: "Santé publique",
  biotechnologies: "Biotechnologies",
  science_laboratoire_medicale: "Sciences de laboratoire médical",
  sciences_biomedicales: "Sciences biomédicales",
  physiotherapie: "Physiothérapie / Kinésithérapie",
  nutrition: "Nutrition et diététique",
  // Sciences et Technologies
  mathematiques: "Mathématiques",
  physique: "Physique",
  chimie: "Chimie",
  biologie: "Biologie",
  sciences_terre: "Sciences de la Terre et Géologie",
  environnement: "Sciences de l'Environnement",
  energies_renouvelables: "Énergies renouvelables",
  geomatique: "Géomatique / Géographie physique",
  statistiques: "Statistiques et Probabilités",
  informatique_generale: "Informatique générale",
  developpement_web: "Développement Web",
  developpement_mobile: "Développement d'applications mobiles",
  intelligence_artificielle: "Intelligence Artificielle (IA)",
  machine_learning: "Machine Learning / Deep Learning",
  science_donnees: "Science des données (Data Science)",
  big_data: "Big Data et Analyse de données",
  "cybersécurité": "Cybersécurité / Sécurité informatique",
  reseaux_telecom: "Réseaux et Télécommunications",
  systemes_reseaux: "Systèmes et Administration Réseaux",
  cloud_computing: "Cloud Computing",
  systemes_embarques: "Systèmes embarqués / IoT",
  informatique_industrielle: "Informatique industrielle / Automatisme",
  base_donnees: "Bases de données et Administration BDD",
  genie_informatique: "Génie Informatique",
  informatique_theorique: "Informatique théorique et Algorithmique",
  multimedia_jeux: "Multimédia et Développement de jeux vidéo",
  informatique_gestion: "Informatique de gestion / Systèmes d'information",
  // Ingénierie
  genie_civil: "Génie Civil",
  genie_electrique: "Génie Électrique / Électrotechnique",
  genie_mecanique: "Génie Mécanique",
  genie_electronique: "Génie Electronique",
  genie_automatique: "Génie Automatique",
  genie_electromecanique: "Génie Electromécanique",
  genie_chimique: "Génie Chimique",
  genie_logiciel: "Génie logiciel / Développement logiciel",
  genie_industriel: "Génie Industriel",
  genie_procedes: "Génie des Procédés / Chimie industrielle",
  genie_energies: "Génie des Énergies",
  genie_automobile: "Génie Automobile",
  genie_aeronautique: "Génie Aéronautique et Spatial",
  genie_robotique: "Génie Robotique",
  genie_minier: "Génie minier",
  maintenance_systemes_industriels: "Maintenance des systèmes industrielle",
  maintenance_systemes_informatique: "Maintenance des systèmes informatique",
  automatisation_industrielle: "Automatisation industrielle",
  tic: "Technologies de l'Information et de la Communication (TIC)",
  logistique: "Logistique et Transport",
  // Agronomie
  agronomie: "Agronomie générale",
  productions_vegetales: "Productions végétales",
  productions_animales: "Productions animales / Élevage",
  sciences_forestieres: "Sciences forestières",
  aquaculture: "Aquaculture et Pêche",
  agribusiness: "Agribusiness / Économie rurale",
  technologie_agroalimentaire: "Technologie agroalimentaire",
  medecine_veterinaire: "Sciences vétérinaires / Médecine vétérinaire",
  gestion_environnement: "Gestion des ressources naturelles",
  // Économie & Gestion
  economie: "Économie",
  gestion_entreprises: "Gestion des Entreprises / Management",
  comptabilite_finance: "Comptabilité / Finance / Audit",
  banque_assurance: "Banque et Assurance",
  marketing: "Marketing / Commerce international",
  grh: "Gestion des Ressources Humaines",
  administration_affaires: "Administration des Affaires",
  // Droit
  droit_prive: "Droit privé",
  droit_public: "Droit public",
  sciences_politiques: "Sciences politiques",
  relations_internationales: "Relations internationales / Diplomatie",
  droit_international: "Droit international",
  // Lettres
  histoire: "Histoire",
  geographie: "Géographie humaine",
  philosophie: "Philosophie",
  litterature: "Littérature (française, anglaise, africaine)",
  linguistique: "Linguistique / Langues modernes",
  anthropologie: "Anthropologie / Sociologie",
  psychologie: "Psychologie",
  communication: "Communication / Journalisme",
  tourisme: "Tourisme / Patrimoine culturel",
  // Éducation
  sciences_education: "Sciences de l'Éducation",
  formation_enseignants: "Formation des enseignants du secondaire (ENS)",
  enseignement_technique: "Formation technique et professionnelle (ENSET)",
  pedagogie: "Pédagogie / Didactique",
  administration_scolaire: "Administration scolaire",
  eps: "Éducation physique et sportive",
  // Autres
  sciences_maritimes: "Sciences maritimes / Océanographie",
  mines_geologie: "Mines et Géologie appliquée",
  hydraulique: "Hydraulique et Maîtrise des Eaux",
  autre: "Autre filière",
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
