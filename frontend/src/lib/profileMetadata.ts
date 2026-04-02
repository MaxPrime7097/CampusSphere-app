const NOT_SPECIFIED = "Non renseigné";

const FACULTY_LABELS: Record<string, string> = {
  informatique: "Informatique",
  mathematiques: "Mathématiques",
  physique: "Physique",
  chimie: "Chimie",
  biologie: "Biologie",
  economie: "Économie",
  droit: "Droit",
  medecine: "Médecine",
  pharmacie: "Pharmacie",
  ingenierie: "Ingénierie",
  lettres: "Lettres et Sciences Humaines",
  sciences_education: "Sciences de l'Éducation",
  psychologie: "Psychologie",
  sociologie: "Sociologie",
  histoire: "Histoire",
  geographie: "Géographie",
  philosophie: "Philosophie",
  langues: "Langues Étrangères",
  communication: "Communication",
  journalisme: "Journalisme",
  art: "Arts",
  musique: "Musique",
  sport: "Sciences et Techniques des Activités Physiques et Sportives",
  agronomie: "Agronomie",
  veterinaire: "Médecine Vétérinaire",
  foresterie: "Foresterie",
  geologie: "Géologie",
  mining: "Mines et Géologie",
  other: "Autre filière",
};

const FACULTY_ALIASES: Record<string, string> = {
  computer_science: "informatique",
  computer_sciences: "informatique",
  maths: "mathematiques",
  mathematique: "mathematiques",
  mathématiques: "mathematiques",
  economie: "economie",
  économie: "economie",
  medecine: "medecine",
  médecine: "medecine",
  génie: "ingenierie",
  genie: "ingenierie",
  language: "langues",
  languages: "langues",
  autre: "other",
};

const STUDY_YEAR_LABELS: Record<string, string> = {
  bts1: "BTS 1",
  bts2: "BTS 2",
  hnd1: "HND 1",
  hnd2: "HND 2",
  l1: "Licence 1",
  l2: "Licence 2",
  l3: "Licence 3",
  bachelor1: "Bachelor 1",
  bachelor2: "Bachelor 2",
  bachelor3: "Bachelor 3",
  bachelor4: "Bachelor 4",
  m1: "Master 1",
  m2: "Master 2",
  d1: "Doctorat 1",
  d2: "Doctorat 2",
  d3: "Doctorat 3",
  phd1: "PhD 1",
  phd2: "PhD 2",
  phd3: "PhD 3",
  other: "Autre niveau",
};

const STUDY_YEAR_ALIASES: Record<string, string> = {
  bac1: "l1",
  bac2: "l2",
  bac3: "l3",
  licence1: "l1",
  licence2: "l2",
  licence3: "l3",
  master1: "m1",
  master2: "m2",
  doctorat1: "d1",
  doctorat2: "d2",
  doctorat3: "d3",
};

const UNIVERSITY_LABELS: Record<string, string> = {
  iuc: "Institut Universitaire de la Côte",
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeFaculty(value: unknown): string {
  const normalized = normalize(value);
  if (!normalized) return "";
  return FACULTY_ALIASES[normalized] || normalized;
}

export function getFacultyLabel(value: unknown): string {
  const normalized = normalizeFaculty(value);
  if (!normalized) return NOT_SPECIFIED;
  return FACULTY_LABELS[normalized] || String(value).trim();
}

export function normalizeStudyYear(value: unknown): string {
  const normalized = normalize(value);
  if (!normalized) return "";
  return STUDY_YEAR_ALIASES[normalized] || normalized;
}

export function getStudyYearLabel(value: unknown): string {
  const normalized = normalizeStudyYear(value);
  if (!normalized) return NOT_SPECIFIED;
  return STUDY_YEAR_LABELS[normalized] || String(value).trim();
}

export function normalizeUniversity(value: unknown): string {
  return normalize(value);
}

export function getUniversityLabel(value: unknown): string {
  const normalized = normalizeUniversity(value);
  if (!normalized) return NOT_SPECIFIED;
  return UNIVERSITY_LABELS[normalized] || String(value).trim();
}
