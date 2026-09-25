/**
 * Profile metadata normalizer and canonical label dictionaries.
 * Converts raw database slugs (e.g. "l3", "iuc", "developpement_web")
 * into human-readable labels (e.g. "Licence 3", "Institut Universitaire de la Côte", "Développement Web").
 */

const STUDY_YEAR_LABELS: Record<string, string> = {
  bts1: 'BTS 1',
  bts2: 'BTS 2',
  hnd1: 'HND 1',
  hnd2: 'HND 2',
  l1: 'Licence 1',
  l2: 'Licence 2',
  l3: 'Licence 3',
  bachelor1: 'Bachelor 1',
  bachelor2: 'Bachelor 2',
  bachelor3: 'Bachelor 3',
  bachelor4: 'Bachelor 4',
  m1: 'Master 1',
  m2: 'Master 2',
  d1: 'Doctorat 1',
  d2: 'Doctorat 2',
  d3: 'Doctorat 3',
  phd1: 'PhD 1',
  phd2: 'PhD 2',
  phd3: 'PhD 3',
  other: 'Autre niveau',
}

const STUDY_YEAR_ALIASES: Record<string, string> = {
  bac1: 'l1',
  bac2: 'l2',
  bac3: 'l3',
  licence1: 'l1',
  licence2: 'l2',
  licence3: 'l3',
  master1: 'm1',
  master2: 'm2',
  doctorat1: 'd1',
  doctorat2: 'd2',
  doctorat3: 'd3',
}

const UNIVERSITY_LABELS: Record<string, string> = {
  iuc: 'Institut Universitaire de la Côte (IUC)',
  universite_yaounde_1: 'Université de Yaoundé I',
  universite_yaounde_2: 'Université de Yaoundé II (Soa)',
  universite_douala: 'Université de Douala',
  universite_dschang: 'Université de Dschang',
  universite_buea: 'University of Buea',
  universite_bamenda: 'University of Bamenda',
  universite_ngaoundere: 'Université de Ngaoundéré',
  universite_maroua: 'Université de Maroua',
  ensp_yaounde: 'École Nationale Supérieure Polytechnique de Yaoundé (ENSP)',
  enset_douala: 'ENSET de Douala',
  enset_bambili: 'ENSET de Bambili',
  ens_yaounde: 'École Normale Supérieure de Yaoundé (ENS)',
  ens_bambili: 'École Normale Supérieure de Bambili',
  enam: 'ENAM (Administration et Magistrature)',
  iric: 'IRIC (Relations Internationales du Cameroun)',
  essec_douala: 'ESSEC de Douala',
  fasa_dschang: 'FASA (Agronomie et Sciences Agricoles)',
  iut_ngaoundere: 'IUT de Ngaoundéré',
  iut_douala: 'IUT de Douala',
  ict_university: 'ICT University',
  catholic_university: 'Catholic University of Cameroon (CATUC)',
  university_siantou: 'University of Siantou',
  istag: 'ISTAG',
  pigier: 'Pigier Cameroun',
  esam: 'ESAM',
  sup_management: 'Sup Management',
  isma: 'ISMA',
  ibs: 'IBS',
  hec_cameroun: 'HEC Cameroun',
  istt: 'ISTT',
  iut_fotso_victor: 'IUT Fotso Victor (Bandjoun)',
  autre_superieur: 'Établissement d\'enseignement supérieur',
}

const FACULTY_LABELS: Record<string, string> = {
  informatique: 'Informatique',
  informatique_generale: 'Informatique Générale',
  developpement_web: 'Développement Web',
  developpement_mobile: 'Développement Mobile',
  intelligence_artificielle: 'Intelligence Artificielle',
  machine_learning: 'Machine Learning',
  science_donnees: 'Science des Données',
  big_data: 'Big Data & Analyse',
  cybersecurite: 'Cybersécurité',
  cybersécurité: 'Cybersécurité',
  reseaux_telecom: 'Réseaux & Télécommunications',
  systemes_reseaux: 'Systèmes & Réseaux',
  cloud_computing: 'Cloud Computing',
  systemes_embarques: 'Systèmes Embarqués & IoT',
  genie_logiciel: 'Génie Logiciel',
  genie_informatique: 'Génie Informatique',
  genie_civil: 'Génie Civil',
  genie_electrique: 'Génie Électrique',
  genie_mecanique: 'Génie Mécanique',
  genie_electronique: 'Génie Électronique',
  genie_industriel: 'Génie Industriel',
  genie_procedes: 'Génie des Procédés',
  genie_energies: 'Génie des Énergies',
  mathematiques: 'Mathématiques',
  physique: 'Physique',
  chimie: 'Chimie',
  biologie: 'Biologie',
  medecine: 'Médecine Générale',
  pharmacie: 'Pharmacie',
  veterinaire: 'Médecine Vétérinaire',
  sciences_infirmieres: 'Sciences Infirmières',
  sante_publique: 'Santé Publique',
  droit: 'Droit',
  economie: 'Économie',
  gestion: 'Gestion d\'Entreprise',
  marketing: 'Marketing',
  communication: 'Communication',
  journalisme: 'Journalisme',
  lettres: 'Lettres & Sciences Humaines',
  psychologie: 'Psychologie',
  sociologie: 'Sociologie',
  agronomie: 'Agronomie',
  geologie: 'Géologie & Mines',
  other: 'Autre filière',
}

/**
 * Humanizes any raw slug like "genie_biomedical" -> "Génie Biomedical"
 */
function humanizeSlug(slug: string): string {
  if (!slug) return ''
  return slug
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function formatStudyYear(val?: string | null): string {
  if (!val) return ''
  const clean = val.trim().toLowerCase()
  const aliased = STUDY_YEAR_ALIASES[clean] || clean
  return STUDY_YEAR_LABELS[aliased] || STUDY_YEAR_LABELS[clean] || humanizeSlug(val)
}

export function formatUniversity(val?: string | null): string {
  if (!val) return ''
  const clean = val.trim().toLowerCase()
  return UNIVERSITY_LABELS[clean] || humanizeSlug(val)
}

export function formatFaculty(val?: string | null): string {
  if (!val) return ''
  const clean = val.trim().toLowerCase()
  return FACULTY_LABELS[clean] || humanizeSlug(val)
}
